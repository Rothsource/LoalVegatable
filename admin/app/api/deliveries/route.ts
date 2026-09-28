import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("deliveries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { email, first_name, last_name, phone } = await req.json();

  if (!email || !first_name || !last_name) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Could not create auth user." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("deliveries")
    .insert({ email, first_name, last_name, phone, is_active: true, user_id: authData.user.id })
    .select()
    .single();

  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json();
  const { error } = await supabaseAdmin.from("deliveries").update({ is_active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { data: delivery } = await supabaseAdmin.from("deliveries").select("user_id").eq("id", id).single();
  await supabaseAdmin.from("deliveries").delete().eq("id", id);
  if (delivery?.user_id) await supabaseAdmin.auth.admin.deleteUser(delivery.user_id);
  return NextResponse.json({ ok: true });
}