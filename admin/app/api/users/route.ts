import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET all users
export async function GET() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || "—",
    status: u.banned_until ? "Blocked" : "Active",
    created_at: u.created_at,
  }));

  return NextResponse.json(users);
}

// PATCH — block or unblock
export async function PATCH(req: Request) {
  const { id, block } = await req.json();

  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    ban_duration: block ? "876600h" : "none", // 100 years = effectively permanent
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — delete user
export async function DELETE(req: Request) {
  const { id } = await req.json();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}