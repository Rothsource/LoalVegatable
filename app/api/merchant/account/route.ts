import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, getRequestUser } from "@/lib/supabaseAdmin";

type AccountUpdateBody = {
  fullName?: string;
  communityName?: string;
  province?: string;
  favVegetable?: string;
  profileUrl?: string;
  password?: string;
  email?: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: NextRequest) {
  const admin = createSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Account updates need SUPABASE_SERVICE_ROLE_KEY on the merchant server." },
      { status: 501 }
    );
  }

  const auth = await getRequestUser(request, admin);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as AccountUpdateBody;
  const fullName = text(body.fullName);
  const communityName = text(body.communityName);
  const province = text(body.province);
  const favVegetable = text(body.favVegetable);
  const profileUrl = text(body.profileUrl);
  const email = text(body.email);
  const password = text(body.password);

  if (!fullName || !communityName || !email) {
    return NextResponse.json({ error: "Full name, community name, and email are required." }, { status: 400 });
  }

  if (password && password.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const userUpdate = {
    ...(email !== auth.user.email ? { email } : {}),
    ...(password ? { password } : {}),
    user_metadata: {
      ...(auth.user.user_metadata ?? {}),
      role: "merchant",
      full_name: fullName,
      community_name: communityName,
      province,
      fav_vegetable: favVegetable,
      profile_url: profileUrl,
    },
  };

  const { error: updateError } = await admin.auth.admin.updateUserById(auth.user.id, userUpdate);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profile_merchants").upsert({
    id: auth.user.id,
    full_name: fullName,
    community_name: communityName,
    province,
    fav_vegetable: favVegetable,
    profile_url: profileUrl,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    warning: profileError
      ? `Auth updated, but profile table sync failed: ${profileError.message}`
      : null,
  });
}

export async function DELETE(request: NextRequest) {
  const admin = createSupabaseAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Account deletion needs SUPABASE_SERVICE_ROLE_KEY on the merchant server." },
      { status: 501 }
    );
  }

  const auth = await getRequestUser(request, admin);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { error: profileError } = await admin.from("profile_merchants").delete().eq("id", auth.user.id);
  const { error: deleteError } = await admin.auth.admin.deleteUser(auth.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    warning: profileError
      ? `Account deleted, but profile cleanup failed: ${profileError.message}`
      : null,
  });
}