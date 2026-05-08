import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("profile_merchants")
    .select("id, full_name, community_name, province, fav_vegetable, is_approved, is_verified, created_at, certificate_url, profile_url, background_urls")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { id, is_approved } = await req.json();
  const { error } = await supabaseAdmin
    .from("profile_merchants")
    .update({ is_approved })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  // delete from auth too
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}