// admin/app/api/orders/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    // 1. Fetch all orders ordered by created_at DESC
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(`
        id, user_id, address_id, status, payment_status, total_amount, notes,
        created_at, updated_at, accepted_at, arrived_at, completed_at,
        distributor_id, delivery_id
      `)
      .order("created_at", { ascending: false });

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const orderIds = orders.map((o) => o.id);
    const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
    const addressIds = [...new Set(orders.map((o) => o.address_id).filter(Boolean))];
    const deliveryIds = [...new Set(orders.map((o) => o.delivery_id).filter(Boolean))];

    // 2. Fetch order items, addresses, user profiles, deliveries, and auth users in parallel
    const [itemsRes, addressesRes, profilesRes, deliveriesRes, authRes] = await Promise.all([
      orderIds.length
        ? supabaseAdmin
            .from("order_items")
            .select("id, order_id, product_id, quantity, unit_price, total_price, created_at")
            .in("order_id", orderIds)
        : Promise.resolve({ data: [] as any[], error: null }),

      addressIds.length
        ? supabaseAdmin
            .from("addresses")
            .select("id, user_id, phone, street, city, province, lat, lng, is_default, recipient_name")
            .in("id", addressIds)
        : Promise.resolve({ data: [] as any[], error: null }),

      userIds.length
        ? supabaseAdmin
            .from("profile_users")
            .select("id, first_name, last_name, location")
            .in("id", userIds)
        : Promise.resolve({ data: [] as any[], error: null }),

      deliveryIds.length
        ? supabaseAdmin
            .from("deliveries")
            .select("id, first_name, last_name, phone, email")
            .in("id", deliveryIds)
        : Promise.resolve({ data: [] as any[], error: null }),

      supabaseAdmin.auth.admin.listUsers(),
    ]);

    const items = itemsRes.data ?? [];
    const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))];

    // 3. Fetch products for items
    const { data: products } = productIds.length
      ? await supabaseAdmin
          .from("products")
          .select("id, name, unit, price, profile_pic_url, merchant_id")
          .in("id", productIds)
      : { data: [] };

    const merchantIds = [...new Set((products ?? []).map((p) => p.merchant_id).filter(Boolean))];

    // 4. Fetch merchants
    const { data: merchants } = merchantIds.length
      ? await supabaseAdmin
          .from("profile_merchants")
          .select("id, full_name, community_name, phone_number, province")
          .in("id", merchantIds)
      : { data: [] };

    // Build lookup maps
    const productMap = new Map((products ?? []).map((p) => [String(p.id), p]));
    const merchantMap = new Map((merchants ?? []).map((m) => [String(m.id), m]));
    const addressMap = new Map((addressesRes.data ?? []).map((a) => [String(a.id), a]));
    const profileMap = new Map((profilesRes.data ?? []).map((u) => [String(u.id), u]));
    const deliveryMap = new Map((deliveriesRes.data ?? []).map((d) => [String(d.id), d]));
    const emailMap = new Map((authRes.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    // Group items by order_id
    const itemsByOrder = new Map<string, any[]>();
    for (const item of items) {
      const prod = productMap.get(String(item.product_id));
      const merch = prod?.merchant_id ? merchantMap.get(String(prod.merchant_id)) : null;

      const enrichedItem = {
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price || (item.quantity * item.unit_price),
        product_name: prod?.name || "Harvest Produce",
        unit: prod?.unit || "kg",
        img: prod?.profile_pic_url || "",
        merchant_id: prod?.merchant_id || null,
        merchant_name: merch?.community_name || merch?.full_name || "Local Farm",
        merchant_province: merch?.province || "",
        merchant_phone: merch?.phone_number || "",
      };

      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }
      itemsByOrder.get(item.order_id)!.push(enrichedItem);
    }

    // 5. Assemble fully enriched orders
    const enrichedOrders = orders.map((o) => {
      const orderItems = itemsByOrder.get(o.id) ?? [];
      const addr = o.address_id ? addressMap.get(String(o.address_id)) : null;
      const user = o.user_id ? profileMap.get(String(o.user_id)) : null;
      const userEmail = o.user_id ? emailMap.get(o.user_id) : "";
      const delivery = o.delivery_id ? deliveryMap.get(String(o.delivery_id)) : null;

      // Unique merchants in this order
      const merchantNames = [...new Set(orderItems.map((i) => i.merchant_name).filter(Boolean))];

      return {
        id: o.id,
        created_at: o.created_at,
        updated_at: o.updated_at,
        accepted_at: o.accepted_at,
        arrived_at: o.arrived_at,
        completed_at: o.completed_at,
        status: o.status || "pending",
        payment_status: o.payment_status || "pending",
        total_amount: Number(o.total_amount) || 0,
        notes: o.notes || null,
        items: orderItems,
        item_count: orderItems.reduce((acc: number, cur: any) => acc + (cur.quantity || 1), 0),
        merchants: merchantNames,
        customer: {
          id: o.user_id,
          name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Customer" : "Customer",
          email: userEmail || null,
          phone: addr?.phone || null,
          location: user?.location || null,
        },
        address: addr
          ? {
              id: addr.id,
              street: addr.street,
              province: addr.province,
              phone: addr.phone,
              lat: addr.lat,
              lng: addr.lng,
              recipient_name: addr.recipient_name,
            }
          : null,
        delivery: delivery
          ? {
              id: delivery.id,
              name: `${delivery.first_name || ""} ${delivery.last_name || ""}`.trim(),
              phone: delivery.phone,
              email: delivery.email,
            }
          : null,
      };
    });

    return NextResponse.json({ orders: enrichedOrders });
  } catch (err: any) {
    console.error("Admin orders API error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch orders" }, { status: 500 });
  }
}
