import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Missing service role key." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const distributorId = searchParams.get("distributorId");

  if (!distributorId) {
    return NextResponse.json({ pending: [], active: [], community_name: "" });
  }

  // 1. Look up distributor's assigned merchant/community
  const { data: dist, error: distError } = await admin
    .from("profile_distributors")
    .select("merchant_id, status")
    .eq("id", distributorId)
    .maybeSingle();

  if (distError || !dist?.merchant_id) {
    return NextResponse.json({
      pending: [],
      active: [],
      community_name: "",
      error: "Distributor profile not linked to any community.",
    });
  }

  // Fetch community name
  const { data: merchantProfile } = await admin
    .from("profile_merchants")
    .select("community_name, full_name, province")
    .eq("id", dist.merchant_id)
    .maybeSingle();

  const communityName =
    merchantProfile?.community_name || merchantProfile?.full_name || "Community Farm";

  // 2. Pending orders waiting to be claimed (including product merchant_id)
  const { data: pendingData, error: pendingError } = await admin
    .from("orders")
    .select(`
      id, status, total_amount, created_at, distributor_id,
      address:address_id ( street, province, phone ),
      items:order_items (
        product_id, quantity, unit_price, total_price,
        products ( name, unit, profile_pic_url, merchant_id )
      )
    `)
    .eq("status", "pending")
    .is("distributor_id", null)
    .order("created_at", { ascending: true });

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  // STRICT COMMUNITY FILTER:
  // Only show pending orders where the produce was bought from THIS distributor's community
  const communityPending = (pendingData || []).filter((o: any) => {
    const itemMerchants = (o.items || [])
      .map((it: any) => {
        const prod = Array.isArray(it.products) ? it.products[0] : it.products;
        return prod?.merchant_id;
      })
      .filter(Boolean);
    return itemMerchants.length > 0 && itemMerchants.every((mId: string) => mId === dist.merchant_id);
  });

  // 3. Active orders claimed by this distributor
  let activeData: any[] = [];
  const { data: activeRows, error: activeError } = await admin
    .from("orders")
    .select(`
      id, status, total_amount, created_at, distributor_id,
      address:address_id ( street, province, phone ),
      items:order_items (
        product_id, quantity, unit_price, total_price,
        products ( name, unit, profile_pic_url, merchant_id )
      )
    `)
    .eq("distributor_id", distributorId)
    .in("status", ["accepted", "preparing", "packaged", "out_for_delivery"])
    .order("created_at", { ascending: false });

  if (!activeError && activeRows) {
    activeData = activeRows;
  }

  const formatOrder = (o: any) => ({
    id: o.id,
    status: o.status,
    total_amount: o.total_amount,
    created_at: o.created_at,
    community_name: communityName,
    merchant_id: dist.merchant_id,
    address: Array.isArray(o.address) ? o.address[0] : o.address,
    items: (o.items || []).map((it: any) => {
      const prod = Array.isArray(it.products) ? it.products[0] : it.products;
      return {
        product_id: it.product_id,
        name: prod?.name || "Fresh Produce",
        unit: prod?.unit || "kg",
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price || (it.quantity * it.unit_price),
        img: prod?.profile_pic_url || "",
      };
    }),
  });

  return NextResponse.json({
    pending: communityPending.map(formatOrder),
    active: activeData.map(formatOrder),
    community_name: communityName,
  });
}

// POST: Accept order with strict community verification
export async function POST(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Missing service role key." }, { status: 500 });
  }

  let body: { orderId?: string; distributorId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orderId, distributorId } = body;
  if (!orderId || !distributorId) {
    return NextResponse.json({ error: "Both orderId and distributorId are required." }, { status: 400 });
  }

  // 1. Verify distributor and find their assigned community
  const { data: dist, error: distError } = await admin
    .from("profile_distributors")
    .select("merchant_id, status, full_name")
    .eq("id", distributorId)
    .maybeSingle();

  if (distError || !dist || !dist.merchant_id) {
    return NextResponse.json(
      { error: "Distributor profile not found or not linked to any community farm." },
      { status: 403 }
    );
  }

  if (dist.status === "inactive") {
    return NextResponse.json({ error: "This distributor account is inactive." }, { status: 403 });
  }

  // 2. Fetch the target order and verify its items
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(`
      id, status, distributor_id,
      items:order_items (
        product_id,
        products ( name, merchant_id )
      )
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== "pending" || order.distributor_id) {
    return NextResponse.json(
      { error: "This order is no longer pending or has already been claimed by another distributor." },
      { status: 409 }
    );
  }

  // 3. COMMUNITY VALIDATION:
  // Check if every product in the order belongs to this distributor's community
  const orderMerchants = (order.items || [])
    .map((it: any) => it.products?.merchant_id)
    .filter(Boolean);

  const isCommunityMatch =
    orderMerchants.length > 0 && orderMerchants.every((mId: string) => mId === dist.merchant_id);

  if (!isCommunityMatch) {
    // Look up the name of the community that actually owns this order
    const actualMerchantId = orderMerchants[0];
    let actualCommunityName = "another community farm";
    if (actualMerchantId) {
      const { data: actualMerchant } = await admin
        .from("profile_merchants")
        .select("community_name, full_name")
        .eq("id", actualMerchantId)
        .maybeSingle();
      if (actualMerchant) {
        actualCommunityName = actualMerchant.community_name || actualMerchant.full_name || actualCommunityName;
      }
    }

    return NextResponse.json(
      {
        error: `Access Denied: This order was placed with "${actualCommunityName}". Only distributors registered under that community can accept it.`,
      },
      { status: 403 }
    );
  }

  // 4. Update the order to accepted status
  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({
      status: "accepted",
      distributor_id: distributorId,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .is("distributor_id", null)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message || "Could not claim order. It may have just been claimed by another distributor." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    orderId: updated.id,
    message: "Order successfully accepted.",
  });
}
