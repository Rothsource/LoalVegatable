import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

type PickupInfo = {
  label: string;
  address: string;
  coordinates?: { latitude: number; longitude: number };
};

async function resolvePickups(admin: ReturnType<typeof createSupabaseAdmin>, distributorIds: string[]): Promise<Map<string, PickupInfo>> {
  const pickupMap = new Map<string, PickupInfo>();
  const validIds = [...new Set(distributorIds.filter(Boolean))];
  if (!admin || validIds.length === 0) return pickupMap;

  try {
    const { data: distProfiles } = await admin
      .from("profile_distributors")
      .select("id, merchant_id, address, latitude, longitude")
      .in("id", validIds);

    const pendingMerchantIds: string[] = [];
    (distProfiles || []).forEach((d) => {
      if (d.address) {
        const lat = d.latitude != null ? Number(d.latitude) : NaN;
        const lng = d.longitude != null ? Number(d.longitude) : NaN;
        pickupMap.set(d.id, {
          label: "Distributor Hub (Phnom Penh)",
          address: d.address,
          coordinates: !isNaN(lat) && !isNaN(lng) ? { latitude: lat, longitude: lng } : undefined,
        });
      } else if (d.merchant_id) {
        pendingMerchantIds.push(d.merchant_id);
      }
    });

    const merchantIds = [...new Set(pendingMerchantIds)];
    if (merchantIds.length > 0) {
      const { data: locations } = await admin
        .from("merchant_locations")
        .select("merchant_id, address, latitude, longitude")
        .in("merchant_id", merchantIds);

      const locByMerchant = new Map<string, { address: string; latitude: number | null; longitude: number | null }>();
      (locations || []).forEach((l) => {
        if (l.merchant_id) locByMerchant.set(l.merchant_id, l);
      });

      (distProfiles || []).forEach((d) => {
        if (!pickupMap.has(d.id) && d.merchant_id) {
          const loc = locByMerchant.get(d.merchant_id);
          if (loc && loc.address) {
            const lat = loc.latitude != null ? Number(loc.latitude) : NaN;
            const lng = loc.longitude != null ? Number(loc.longitude) : NaN;
            pickupMap.set(d.id, {
              label: "Pickup location",
              address: loc.address,
              coordinates: !isNaN(lat) && !isNaN(lng) ? { latitude: lat, longitude: lng } : undefined,
            });
          }
        }
      });
    }
  } catch (err) {
    console.error("Failed to resolve pickups:", err);
  }

  return pickupMap;
}

export async function GET(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Missing service role key." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "incoming";
  const riderId = searchParams.get("riderId");
  const orderId = searchParams.get("id");

  const ORDER_SELECT = `
    id, status, total_amount, created_at, accepted_at, arrived_at, completed_at, distributor_id, delivery_id,
    address:address_id ( street, province, phone, lat, lng ),
    customer:user_id ( first_name, last_name ),
    items:order_items (
      id, quantity, unit_price, total_price,
      product:product_id ( name, unit, profile_pic_url )
    )
  `;

  try {
    if (type === "single" && orderId) {
      const { data: order, error } = await admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("id", orderId)
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!order) return NextResponse.json({ order: null });

      const pickups = await resolvePickups(admin, [order.distributor_id]);
      const pickup = pickups.get(order.distributor_id) || {
        label: "Pickup location",
        address: "Address unavailable",
      };

      return NextResponse.json({ order: { ...order, pickup } });
    }

    if (type === "incoming") {
      const { data: orders, error } = await admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("status", "out_for_delivery")
        .is("delivery_id", null)
        .order("created_at", { ascending: true });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const distIds = (orders || []).map((o) => o.distributor_id);
      const pickups = await resolvePickups(admin, distIds);

      const enriched = (orders || []).map((o) => ({
        ...o,
        pickup: pickups.get(o.distributor_id) || {
          label: "Pickup location",
          address: "Address unavailable",
        },
      }));

      return NextResponse.json({ orders: enriched });
    }

    if (type === "current") {
      if (!riderId) return NextResponse.json({ order: null });

      const { data: order, error } = await admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("delivery_id", riderId)
        .eq("status", "out_for_delivery")
        .limit(1)
        .maybeSingle();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!order) return NextResponse.json({ order: null });

      const pickups = await resolvePickups(admin, [order.distributor_id]);
      const pickup = pickups.get(order.distributor_id) || {
        label: "Pickup location",
        address: "Address unavailable",
      };

      return NextResponse.json({ order: { ...order, pickup } });
    }

    if (type === "history") {
      if (!riderId) return NextResponse.json({ orders: [] });

      const { data: orders, error } = await admin
        .from("orders")
        .select(ORDER_SELECT)
        .eq("delivery_id", riderId)
        .eq("status", "delivered")
        .order("completed_at", { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const distIds = (orders || []).map((o) => o.distributor_id);
      const pickups = await resolvePickups(admin, distIds);

      const enriched = (orders || []).map((o) => ({
        ...o,
        pickup: pickups.get(o.distributor_id) || {
          label: "Pickup location",
          address: "Address unavailable",
        },
      }));

      return NextResponse.json({ orders: enriched });
    }

    if (type === "notifications") {
      // 1. Available incoming dispatch requests
      const { data: incomingOrders } = await admin
        .from("orders")
        .select("id, total_amount, created_at")
        .eq("status", "out_for_delivery")
        .is("delivery_id", null)
        .order("created_at", { ascending: false })
        .limit(10);

      // 2. Assigned orders for this rider
      let assignedOrders: any[] = [];
      if (riderId) {
        const { data: assigned } = await admin
          .from("orders")
          .select("id, status, total_amount, created_at, accepted_at, completed_at")
          .eq("delivery_id", riderId)
          .order("created_at", { ascending: false })
          .limit(6);
        assignedOrders = assigned || [];
      }

      return NextResponse.json({
        incoming: incomingOrders || [],
        assigned: assignedOrders,
      });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Missing service role key." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { action, orderId, riderId } = body;

    if (!orderId || !riderId) {
      return NextResponse.json({ error: "orderId and riderId are required" }, { status: 400 });
    }

    if (action === "accept") {
      const now = new Date().toISOString();
      const { data, error } = await admin
        .from("orders")
        .update({
          delivery_id: riderId,
          accepted_at: now,
          updated_at: now,
        })
        .eq("id", orderId)
        .eq("status", "out_for_delivery")
        .is("delivery_id", null)
        .select("id");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (!data || data.length === 0) {
        return NextResponse.json({ error: "Someone else already accepted this delivery." }, { status: 409 });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "arrive") {
      const now = new Date().toISOString();
      const { data, error } = await admin
        .from("orders")
        .update({
          status: "delivered",
          arrived_at: now,
          completed_at: now,
          updated_at: now,
        })
        .eq("id", orderId)
        .eq("delivery_id", riderId)
        .select("id");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (!data || data.length === 0) {
        return NextResponse.json({ error: "Active delivery not found." }, { status: 404 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
