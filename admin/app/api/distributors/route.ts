import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteUserCompletely } from "@/lib/userCleanup";
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
      email_confirm: true,
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

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing distributor id." }, { status: 400 });

  try {
    await deleteUserCompletely(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Distributor deletion error:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete distributor." }, { status: 500 });
  }
}