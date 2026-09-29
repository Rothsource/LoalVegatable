import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Missing service role key." }, { status: 501 });

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const { data: distributor, error } = await admin
    .from("profile_distributors")
    .select("id, full_name, status")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!distributor) {
    return NextResponse.json(
      { error: "No distributor account found for this email. Please ensure your merchant has added you." },
      { status: 404 }
    );
  }

  if (distributor.status === "pending") {
    return NextResponse.json(
      { error: "Your distributor account is pending administrator approval. Please wait for an admin to approve your request.", status: "pending" },
      { status: 403 }
    );
  }

  if (distributor.status === "inactive") {
    return NextResponse.json(
      { error: "Your distributor account has been deactivated. Please contact your merchant or administrator.", status: "inactive" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    id: distributor.id,
    name: distributor.full_name,
    status: distributor.status,
  });
}

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
    user_metadata: { role: "distributor", status: "active" },
  });

  if (pwError) return NextResponse.json({ error: pwError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}