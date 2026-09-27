import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Missing service role key." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const distributorId = searchParams.get("distributorId");

  // 1. Pending orders waiting to be claimed
  const { data: pendingData, error: pendingError } = await admin
    .from("orders")
    .select(`
      id, status, total_amount, created_at, distributor_id,
      address:address_id ( street, province, phone ),
      items:order_items (
        product_id, quantity, unit_price, total_price,
        products ( name, unit, profile_pic_url )
      )
    `)
    .eq("status", "pending")
    .is("distributor_id", null)
    .order("created_at", { ascending: true });

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  // 2. Active orders claimed by this distributor
  let activeData: any[] = [];
  if (distributorId) {
    const { data: activeRows, error: activeError } = await admin
      .from("orders")
      .select(`
        id, status, total_amount, created_at, distributor_id,
        address:address_id ( street, province, phone ),
        items:order_items (
          product_id, quantity, unit_price, total_price,
          products ( name, unit, profile_pic_url )
        )
      `)
      .eq("distributor_id", distributorId)
      .in("status", ["accepted", "preparing", "packaged", "out_for_delivery"])
      .order("created_at", { ascending: false });

    if (!activeError && activeRows) {
      activeData = activeRows;
    }
  }

  const formatOrder = (o: any) => ({
    id: o.id,
    status: o.status,
    total_amount: o.total_amount,
    created_at: o.created_at,
    address: Array.isArray(o.address) ? o.address[0] : o.address,
    items: (o.items || []).map((it: any) => ({
      product_id: it.product_id,
      name: it.products?.name || "Fresh Produce",
      unit: it.products?.unit || "kg",
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price || (it.quantity * it.unit_price),
      img: it.products?.profile_pic_url || "",
    })),
  });

  return NextResponse.json({
    pending: (pendingData || []).map(formatOrder),
    active: activeData.map(formatOrder),
  });
}
