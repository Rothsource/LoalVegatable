// app/api/merchant/distributors/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  mapDistributorRow,
  sanitizeDistributorForm,
  validateDistributorForm,
} from "@/lib/distributors";
import { createSupabaseAdmin, getRequestMerchant } from "@/lib/supabaseAdmin";

type DistributorBody = {
  name?: string;
  email?: string;
};

const DISTRIBUTOR_COLUMNS = "id, merchant_id, full_name, email, status, created_at";

export async function GET(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Distributor accounts need SUPABASE_SERVICE_ROLE_KEY on the merchant server." },
      { status: 501 }
    );
  }

  const auth = await getRequestMerchant(request, admin);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await admin
    .from("profile_distributors")
    .select(DISTRIBUTOR_COLUMNS)
    .eq("merchant_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ distributors: (data ?? []).map(mapDistributorRow) });
}

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Distributor accounts need SUPABASE_SERVICE_ROLE_KEY on the merchant server." },
      { status: 501 }
    );
  }

  const auth = await getRequestMerchant(request, admin);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: DistributorBody;
  try {
    body = (await request.json()) as DistributorBody;
  } catch {
    return NextResponse.json({ error: "Invalid distributor details." }, { status: 400 });
  }

  const input = sanitizeDistributorForm(body);
  const validationError = validateDistributorForm(input);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  // No password set here — distributor claims their account via magic link after admin approval.
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    email_confirm: false,
    user_metadata: {
      role: "distributor",
      full_name: input.name,
      merchant_id: auth.user.id,
      status: "pending",
    },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create distributor account." },
      { status: 400 }
    );
  }

  const distributor = {
    id: data.user.id,
    merchant_id: auth.user.id,
    full_name: input.name,
    email: input.email,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const { error: profileError } = await admin.from("profile_distributors").insert(distributor);

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return NextResponse.json(
      { error: `Could not save the distributor profile: ${profileError.message}` },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, distributor: mapDistributorRow(distributor) });
}