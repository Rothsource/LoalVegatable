import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Missing service role key." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  let merchantId = searchParams.get("merchantId");

  // Fallback to token if merchantId not passed in query
  if (!merchantId) {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (token) {
      const { data: { user } } = await admin.auth.getUser(token);
      if (user) merchantId = user.id;
    }
  }

  if (!merchantId) {
    return NextResponse.json({ error: "Merchant ID is required." }, { status: 400 });
  }

  // 1. Get products owned by this merchant
  const { data: products, error: prodError } = await admin
    .from("products")
    .select("id, name, unit, profile_pic_url")
    .eq("merchant_id", merchantId);

  if (prodError) {
    return NextResponse.json({ error: prodError.message }, { status: 500 });
  }

  if (!products || products.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const productIds = products.map((p) => p.id);

  // 2. Query order items for these products
  const { data: items, error: itemsError } = await admin
    .from("order_items")
    .select("id, order_id, product_id, quantity, unit_price, total_price")
    .in("product_id", productIds);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const orderIds = [...new Set(items.map((i) => i.order_id))];

  // 3. Query the parent orders with address details
  const { data: ordersData, error: ordersError } = await admin
    .from("orders")
    .select(`
      id, created_at, status, payment_status, total_amount, user_id, address_id,
      addresses ( street, province, phone )
    `)
    .in("id", orderIds)
    .order("created_at", { ascending: false });

  if (ordersError || !ordersData) {
    return NextResponse.json({ error: ordersError?.message || "Failed to load orders" }, { status: 500 });
  }

  // 4. Assemble clean MerchantOrder objects
  const compiled = ordersData.map((o: any) => {
    const orderItems = items
      .filter((i) => i.order_id === o.id)
      .map((i) => {
        const prod = productMap.get(i.product_id);
        return {
          id: i.id,
          product_id: i.product_id,
          product_name: prod?.name || "Fresh Produce",
          unit: prod?.unit || "kg",
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price || (i.quantity * i.unit_price),
          img: prod?.profile_pic_url || "",
        };
      });

    const addr = Array.isArray(o.addresses) ? o.addresses[0] : o.addresses;

    return {
      id: o.id,
      created_at: o.created_at,
      status: o.status || "pending",
      payment_status: o.payment_status || "pending",
      total_amount: o.total_amount || 0,
      customer_phone: addr?.phone || "",
      address_street: addr?.street || "",
      address_province: addr?.province || "",
      items: orderItems,
    };
  });

  return NextResponse.json({ orders: compiled });
}
