import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
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
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const { id, is_active } = await req.json();
  const { error } = await supabaseAdmin
    .from("products")
    .update({ is_active })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

