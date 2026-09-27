import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Missing service role key." }, { status: 501 });

  const { email, password } = await request.json();
  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Email and an 8+ character password are required." }, { status: 400 });
  }

  const { data: distributor, error } = await admin
    .from("profile_distributors")
    .select("id, status")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error || !distributor) {
    return NextResponse.json({ error: "No approved distributor found with that email." }, { status: 404 });
  }

  if (distributor.status !== "active") {
    return NextResponse.json({ error: "This distributor account is not yet approved by admin." }, { status: 403 });
  }

  const { error: pwError } = await admin.auth.admin.updateUserById(distributor.id, {
    password,
    email_confirm: true,
  });

  if (pwError) return NextResponse.json({ error: pwError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}