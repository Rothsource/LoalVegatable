import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
}

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Find this rider's deliveries.id from their auth user_id
  const { data: delivery, error: deliveryError } = await supabase
    .from("deliveries")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (deliveryError || !delivery) {
    return NextResponse.json({ error: "No delivery account found." }, { status: 403 });
  }

  // Orders assigned to this rider
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id, status, payment_status, total_amount, notes, created_at,
      address:addresses(street, city, province, recipient_name, phone),
      order_items(quantity, unit_price, total_price, products(name, unit, merchant_id))
    `)
    .eq("delivery_id", delivery.id)
    .order("created_at", { ascending: false });

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 400 });
  }

  // Attach merchant location for each order (one merchant per order, confirmed)
  const enriched = await Promise.all(
    (orders ?? []).map(async (order) => {
      const merchantId = (order.order_items?.[0]?.products as any)?.merchant_id ?? null;
      let merchantLocation = null;

      if (merchantId) {
        const { data: loc } = await supabase
          .from("merchant_locations")
          .select("latitude, longitude, address, updated_at")
          .eq("merchant_id", merchantId)
          .single();
        merchantLocation = loc ?? null;
      }

      return { ...order, merchant_location: merchantLocation };
    })
  );

  return NextResponse.json(enriched);
}