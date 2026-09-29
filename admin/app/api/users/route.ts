// admin/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteUserCompletely } from "@/lib/userCleanup";

export async function GET() {
  const { data: users, error } = await supabaseAdmin
    .from("profile_users")
    .select("id, first_name, last_name, location, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = (users ?? []).map((u) => u.id);

  const [ordersRes, addressesRes, authRes] = await Promise.all([
    userIds.length
      ? supabaseAdmin
          .from("orders")
          .select("id, user_id, status, payment_status, total_amount, created_at")
          .in("user_id", userIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    userIds.length
      ? supabaseAdmin
          .from("addresses")
          .select("user_id, label, recipient_name, phone, street, city, province, is_default")
          .in("user_id", userIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    supabaseAdmin.auth.admin.listUsers(),
  ]);

  if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  if (addressesRes.error) return NextResponse.json({ error: addressesRes.error.message }, { status: 500 });

  const emailMap = Object.fromEntries(
    (authRes.data?.users ?? []).map((u) => [u.id, u.email ?? null])
  );

  const ordersByUser: Record<string, any[]> = {};
  (ordersRes.data ?? []).forEach((o) => {
    if (!ordersByUser[o.user_id]) ordersByUser[o.user_id] = [];
    ordersByUser[o.user_id].push(o);
  });

  const defaultAddressByUser: Record<string, any> = {};
  (addressesRes.data ?? []).forEach((a) => {
    if (a.is_default || !defaultAddressByUser[a.user_id]) {
      defaultAddressByUser[a.user_id] = a;
    }
  });

  const enriched = (users ?? []).map((u) => {
    const orders = ordersByUser[u.id] ?? [];
    const totalSpent = orders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    return {
      ...u,
      email: emailMap[u.id] ?? null,
      orders,
      order_count: orders.length,
      total_spent: totalSpent,
      default_address: defaultAddressByUser[u.id] ?? null,
    };
  });

  return NextResponse.json({ users: enriched });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing user id." }, { status: 400 });

  try {
    await deleteUserCompletely(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Consumer deletion error:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete consumer user." }, { status: 500 });
  }
}