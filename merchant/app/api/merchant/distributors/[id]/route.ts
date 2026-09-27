// app/api/merchant/distributors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mapDistributorRow } from "@/lib/distributors";
import { createSupabaseAdmin, getRequestMerchant } from "@/lib/supabaseAdmin";
import type { DistributorRow } from "@/types/distributor";

const DISTRIBUTOR_COLUMNS = "id, merchant_id, full_name, email, status, created_at";

async function ownedDistributor(
  admin: NonNullable<ReturnType<typeof createSupabaseAdmin>>,
  id: string,
  merchantId: string
) {
  return admin
    .from("profile_distributors")
    .select(DISTRIBUTOR_COLUMNS)
    .eq("id", id)
    .eq("merchant_id", merchantId)
    .maybeSingle();
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/merchant/distributors/[id]">
) {
  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Missing service role key." }, { status: 501 });

  const auth = await getRequestMerchant(request, admin);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const existingResult = await ownedDistributor(admin, id, auth.user.id);
  if (existingResult.error) return NextResponse.json({ error: existingResult.error.message }, { status: 400 });
  if (!existingResult.data) return NextResponse.json({ error: "Distributor not found." }, { status: 404 });

  const existing = mapDistributorRow(existingResult.data as DistributorRow);

  if (existing.status === "Pending") {
    return NextResponse.json(
      { error: "This distributor is still awaiting admin approval." },
      { status: 400 }
    );
  }

  let body: { status?: string };
  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const nextStatus = body.status === "Inactive" ? "Inactive" : "Active";

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: nextStatus === "Inactive" ? "876000h" : "none",
    user_metadata: {
      role: "distributor",
      full_name: existing.name,
      merchant_id: auth.user.id,
      status: nextStatus,
    },
  });

  if (authUpdateError) return NextResponse.json({ error: authUpdateError.message }, { status: 400 });

  const { data, error: profileError } = await admin
    .from("profile_distributors")
    .update({ status: nextStatus })
    .eq("id", id)
    .eq("merchant_id", auth.user.id)
    .select(DISTRIBUTOR_COLUMNS)
    .single();

  if (profileError || !data) {
    return NextResponse.json({ error: profileError?.message ?? "Could not update status." }, { status: 400 });
  }

  return NextResponse.json({ distributor: mapDistributorRow(data) });
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/merchant/distributors/[id]">
) {
  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Missing service role key." }, { status: 501 });

  const auth = await getRequestMerchant(request, admin);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const existingResult = await ownedDistributor(admin, id, auth.user.id);
  if (existingResult.error) return NextResponse.json({ error: existingResult.error.message }, { status: 400 });
  if (!existingResult.data) return NextResponse.json({ error: "Distributor not found." }, { status: 404 });

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(id);
  if (authDeleteError) return NextResponse.json({ error: authDeleteError.message }, { status: 400 });

  const { error: profileDeleteError } = await admin
    .from("profile_distributors")
    .delete()
    .eq("id", id)
    .eq("merchant_id", auth.user.id);

  return NextResponse.json({
    ok: true,
    warning: profileDeleteError ? `Login deleted, but profile cleanup failed: ${profileDeleteError.message}` : null,
  });
}