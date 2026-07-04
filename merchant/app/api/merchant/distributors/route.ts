import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, getRequestUser } from "@/lib/supabaseAdmin";

type DistributorBody = {
  name?: string;
  email?: string;
  phone?: string;
  deliveryArea?: string;
  password?: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Distributor accounts need SUPABASE_SERVICE_ROLE_KEY on the merchant server." },
      { status: 501 }
    );
  }

  const auth = await getRequestUser(request, admin);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as DistributorBody;
  const name = text(body.name);
  const email = text(body.email);
  const phone = text(body.phone);
  const deliveryArea = text(body.deliveryArea);
  const password = text(body.password);

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and temporary password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "distributor",
      full_name: name,
      phone,
      delivery_area: deliveryArea,
      merchant_id: auth.user.id,
    },
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Could not create distributor account." }, { status: 400 });
  }

  const distributor = {
    id: data.user.id,
    merchant_id: auth.user.id,
    full_name: name,
    email,
    phone,
    delivery_area: deliveryArea,
    status: "Active",
    created_at: new Date().toISOString(),
  };

  const { error: profileError } = await admin.from("profile_distributors").insert(distributor);

  return NextResponse.json({
    ok: true,
    distributor: {
      id: data.user.id,
      name,
      email,
      phone,
      deliveryArea,
      status: "Active",
    },
    warning: profileError
      ? `Distributor login created, but profile table sync failed: ${profileError.message}`
      : null,
  });
}
