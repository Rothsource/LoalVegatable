import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration missing (service role key)." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const { data: delivery, error } = await admin
    .from("deliveries")
    .select("id, first_name, last_name, is_active, user_id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!delivery) {
    return NextResponse.json(
      { error: "This email has not been authorized for Delivery access. Please contact your admin to register." },
      { status: 404 }
    );
  }

  if (!delivery.is_active) {
    return NextResponse.json(
      { error: "Your rider account has been suspended or deactivated. Contact your admin." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    name: `${delivery.first_name || ""} ${delivery.last_name || ""}`.trim(),
    email,
  });
}

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Server configuration missing (service role key)." }, { status: 500 });
  }

  try {
    const { email, password } = await request.json();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Valid email and a password of at least 8 characters are required." },
        { status: 400 }
      );
    }

    const { data: delivery, error: delError } = await admin
      .from("deliveries")
      .select("id, user_id, is_active")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (delError || !delivery) {
      return NextResponse.json(
        { error: "This email has not been authorized for Delivery access." },
        { status: 404 }
      );
    }

    if (!delivery.is_active) {
      return NextResponse.json(
        { error: "Your rider account is inactive. Please contact your admin." },
        { status: 403 }
      );
    }

    let authUserId = delivery.user_id;

    if (!authUserId) {
      // If user_id wasn't linked yet, find or create
      const { data: { users } } = await admin.auth.admin.listUsers();
      const existingUser = users?.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (existingUser) {
        authUserId = existingUser.id;
      } else {
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: { role: "delivery" },
        });
        if (createError || !newUser.user) {
          return NextResponse.json({ error: createError?.message ?? "Failed to create auth user." }, { status: 500 });
        }
        authUserId = newUser.user.id;
      }
      await admin.from("deliveries").update({ user_id: authUserId }).eq("id", delivery.id);
    }

    // Set/update the password in Supabase Auth
    const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, {
      password,
      email_confirm: true,
      user_metadata: { role: "delivery", password_set: true },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Password updated successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to set password." }, { status: 500 });
  }
}
