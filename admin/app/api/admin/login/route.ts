import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Query admin by email
  const { data: admin, error } = await supabaseAdmin
    .from("admins")
    .select("id, email, password_hash, first_name, last_name, role, is_active")
    .eq("email", email)
    .single();

  if (error || !admin) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!admin.is_active) {
    return NextResponse.json({ error: "Account is disabled" }, { status: 403 });
  }

  // Verify password against hash
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Update last login time
  await supabaseAdmin
    .from("admins")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", admin.id);

  return NextResponse.json({
    id: admin.id,
    email: admin.email,
    firstName: admin.first_name,
    lastName: admin.last_name,
    role: admin.role,
  });
}