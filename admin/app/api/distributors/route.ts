import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: distributors, error } = await supabaseAdmin
    .from("profile_distributors")
    .select("id, merchant_id, full_name, email, status, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const merchantIds = [...new Set((distributors ?? []).map((d) => d.merchant_id).filter(Boolean))];
  const { data: merchants } = merchantIds.length
    ? await supabaseAdmin.from("profile_merchants").select("id, full_name, community_name").in("id", merchantIds)
    : { data: [] as any[] };

  const merchantMap = Object.fromEntries(
    (merchants ?? []).map((m) => [m.id, m.community_name || m.full_name || "Unnamed merchant"])
  );

  const enriched = (distributors ?? []).map((d) => ({
    ...d,
    merchant_name: merchantMap[d.merchant_id] ?? "Unknown merchant",
  }));

  return NextResponse.json(enriched);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, action } = body;

  if (!id || !action) return NextResponse.json({ error: "Missing id or action." }, { status: 400 });

  const { data: distributor, error: fetchError } = await supabaseAdmin
    .from("profile_distributors")
    .select("id, email, status")
    .eq("id", id)
    .single();

  if (fetchError || !distributor) return NextResponse.json({ error: "Distributor not found." }, { status: 404 });

  if (action === "approve") {
    if (distributor.status !== "pending") {
      return NextResponse.json({ error: "Only pending distributors can be approved." }, { status: 400 });
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { status: "active" },
    });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    const { error: updateError } = await supabaseAdmin
      .from("profile_distributors")
      .update({ status: "active" })
      .eq("id", id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    await supabaseAdmin.auth.admin.deleteUser(id);
    const { error: deleteError } = await supabaseAdmin.from("profile_distributors").delete().eq("id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "set_password") {
    const { password } = body;
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password,
      email_confirm: true,
    });
    if (pwError) return NextResponse.json({ error: pwError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}