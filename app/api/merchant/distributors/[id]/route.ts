import { NextRequest, NextResponse } from "next/server";
import {
  mapDistributorRow,
  sanitizeDistributorForm,
  validateDistributorForm,
} from "@/lib/distributors";
import { createSupabaseAdmin, getRequestMerchant } from "@/lib/supabaseAdmin";
import type { DistributorFormValues, DistributorRow } from "@/types/distributor";

const DISTRIBUTOR_COLUMNS =
  "id, merchant_id, full_name, email, phone, delivery_area, status, created_at";

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

  if (!admin) {
    return NextResponse.json(
      { error: "Distributor accounts need SUPABASE_SERVICE_ROLE_KEY on the merchant server." },
      { status: 501 }
    );
  }

  const auth = await getRequestMerchant(request, admin);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const existingResult = await ownedDistributor(admin, id, auth.user.id);
  if (existingResult.error) {
    return NextResponse.json({ error: existingResult.error.message }, { status: 400 });
  }
  if (!existingResult.data) {
    return NextResponse.json({ error: "Distributor not found." }, { status: 404 });
  }

  let body: Partial<DistributorFormValues>;
  try {
    body = (await request.json()) as Partial<DistributorFormValues>;
  } catch {
    return NextResponse.json({ error: "Invalid distributor details." }, { status: 400 });
  }

  const existing = mapDistributorRow(existingResult.data as DistributorRow);
  const input = sanitizeDistributorForm({
    name: body.name ?? existing.name,
    email: body.email ?? existing.email,
    phone: body.phone ?? existing.phone,
    deliveryArea: body.deliveryArea ?? existing.deliveryArea,
    password: body.password ?? "",
    status: body.status ?? existing.status,
  });
  const validationError = validateDistributorForm(input);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(id, {
    email: input.email,
    ...(input.password ? { password: input.password } : {}),
    ban_duration: input.status === "Inactive" ? "876000h" : "none",
    user_metadata: {
      role: "distributor",
      full_name: input.name,
      phone: input.phone,
      delivery_area: input.deliveryArea,
      merchant_id: auth.user.id,
      status: input.status,
    },
  });

  if (authUpdateError) {
    return NextResponse.json({ error: authUpdateError.message }, { status: 400 });
  }

  const { data, error: profileError } = await admin
    .from("profile_distributors")
    .update({
      full_name: input.name,
      email: input.email,
      phone: input.phone,
      delivery_area: input.deliveryArea,
      status: input.status,
    })
    .eq("id", id)
    .eq("merchant_id", auth.user.id)
    .select(DISTRIBUTOR_COLUMNS)
    .single();

  if (profileError || !data) {
    return NextResponse.json(
      { error: profileError?.message ?? "Could not update the distributor profile." },
      { status: 400 }
    );
  }

  return NextResponse.json({ distributor: mapDistributorRow(data) });
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/merchant/distributors/[id]">
) {
  const admin = createSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Distributor accounts need SUPABASE_SERVICE_ROLE_KEY on the merchant server." },
      { status: 501 }
    );
  }

  const auth = await getRequestMerchant(request, admin);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const existingResult = await ownedDistributor(admin, id, auth.user.id);
  if (existingResult.error) {
    return NextResponse.json({ error: existingResult.error.message }, { status: 400 });
  }
  if (!existingResult.data) {
    return NextResponse.json({ error: "Distributor not found." }, { status: 404 });
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(id);
  if (authDeleteError) {
    return NextResponse.json({ error: authDeleteError.message }, { status: 400 });
  }

  const { error: profileDeleteError } = await admin
    .from("profile_distributors")
    .delete()
    .eq("id", id)
    .eq("merchant_id", auth.user.id);

  return NextResponse.json({
    ok: true,
    warning: profileDeleteError
      ? `Login deleted, but profile cleanup failed: ${profileDeleteError.message}`
      : null,
  });
}
