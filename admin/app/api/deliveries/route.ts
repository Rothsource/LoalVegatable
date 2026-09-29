import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteUserCompletely } from "@/lib/userCleanup";

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

  const cleanEmail = email.trim().toLowerCase();

  // Check if a delivery entry already exists with this email
  const { data: existingDel } = await supabaseAdmin
    .from("deliveries")
    .select("id")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (existingDel) {
    return NextResponse.json({ error: "A courier account with this email already exists." }, { status: 400 });
  }

  let authUserId: string | null = null;

  // Create auth user without password (courier sets their own password upon activating)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    email_confirm: true,
    user_metadata: { role: "delivery" },
  });

  if (authError || !authData.user) {
    // If the user was already in auth.users (e.g. customer account), link to that auth user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuth = users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (existingAuth) {
      authUserId = existingAuth.id;
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        email_confirm: true,
        user_metadata: { ...(existingAuth.user_metadata || {}), role: "delivery" },
      });
    } else {
      return NextResponse.json({ error: authError?.message ?? "Could not create auth user." }, { status: 400 });
    }
  } else {
    authUserId = authData.user.id;
  }

  const { data, error } = await supabaseAdmin
    .from("deliveries")
    .insert({
      email: cleanEmail,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone?.trim() || null,
      is_active: true,
      user_id: authUserId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing delivery id." }, { status: 400 });
  }

  if (typeof is_active === "boolean") {
    const { error } = await supabaseAdmin.from("deliveries").update({ is_active }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing delivery id." }, { status: 400 });

  const { data: delivery } = await supabaseAdmin.from("deliveries").select("user_id").eq("id", id).single();
  await supabaseAdmin.from("orders").update({ delivery_id: null }).eq("delivery_id", id);
  const { error: delError } = await supabaseAdmin.from("deliveries").delete().eq("id", id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (delivery?.user_id) {
    try {
      await deleteUserCompletely(delivery.user_id);
    } catch (cleanupErr) {
      console.error("Delivery auth cleanup error:", cleanupErr);
    }
  }
  return NextResponse.json({ ok: true });
}