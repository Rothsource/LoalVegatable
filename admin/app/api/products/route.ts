// app/api/products/route.ts
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select(`
      id, name, slug, description, price, compare_price,
      stock_quantity, unit, category_id, image_urls,
      is_organic, is_active, created_at, updated_at,
      merchant_id, profile_pic_url, background_pic_urls,
      harvest_date, expire_date
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const merchantIds = [...new Set((products ?? []).map((p) => p.merchant_id).filter(Boolean))];
  const categoryIds = [...new Set((products ?? []).map((p) => p.category_id).filter(Boolean))];

  const [merchantsRes, categoriesRes] = await Promise.all([
    merchantIds.length
      ? supabaseAdmin.from("profile_merchants").select("id, full_name, community_name").in("id", merchantIds)
      : Promise.resolve({ data: [] as any[] }),
    categoryIds.length
      ? supabaseAdmin.from("categories").select("id, name").in("id", categoryIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const merchantMap = Object.fromEntries(
    (merchantsRes.data ?? []).map((m) => [m.id, m.community_name || m.full_name || "Unnamed merchant"])
  );
  const categoryMap = Object.fromEntries((categoriesRes.data ?? []).map((c) => [c.id, c.name]));

  const enriched = (products ?? []).map((p) => ({
    ...p,
    merchant_name: merchantMap[p.merchant_id] ?? "Unknown merchant",
    category_name: categoryMap[p.category_id] ?? "Uncategorized",
  }));

  return NextResponse.json(enriched);
}

export async function PATCH(req: Request) {
  const { id, is_active } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("products").update({ is_active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 });

  const { count, error: countError } = await supabaseAdmin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if (count && count > 0) {
    return NextResponse.json(
      { error: `This product is in ${count} past order(s) and cannot be deleted. Deactivate instead.` },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}