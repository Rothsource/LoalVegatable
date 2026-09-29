// admin/app/api/merchants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteUserCompletely } from "@/lib/userCleanup";

export async function GET() {
  const { data: merchants, error } = await supabaseAdmin
    .from("profile_merchants")
    .select(
      "id, full_name, community_name, province, fav_vegetable, profile_url, certificate_url, background_urls, is_verified, is_approved, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const merchantIds = (merchants ?? []).map((m) => m.id);

  const { data: products, error: productsError } = merchantIds.length
    ? await supabaseAdmin
        .from("products")
        .select("id, name, price, stock_quantity, is_active, profile_pic_url, merchant_id")
        .in("merchant_id", merchantIds)
    : { data: [] as any[], error: null };

  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });

  const productsByMerchant: Record<string, any[]> = {};
  (products ?? []).forEach((p) => {
    if (!productsByMerchant[p.merchant_id]) productsByMerchant[p.merchant_id] = [];
    productsByMerchant[p.merchant_id].push(p);
  });

  const enriched = (merchants ?? []).map((m) => ({
    ...m,
    products: productsByMerchant[m.id] ?? [],
    product_count: (productsByMerchant[m.id] ?? []).length,
    active_product_count: (productsByMerchant[m.id] ?? []).filter((p) => p.is_active).length,
  }));

  return NextResponse.json({ merchants: enriched });
}

export async function PATCH(request: NextRequest) {
  const { id, is_approved } = await request.json();
  if (!id || typeof is_approved !== "boolean") {
    return NextResponse.json({ error: "id and is_approved (boolean) are required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profile_merchants")
    .update({ is_approved })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing merchant id." }, { status: 400 });

  try {
    await deleteUserCompletely(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Merchant deletion error:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete merchant." }, { status: 500 });
  }
}