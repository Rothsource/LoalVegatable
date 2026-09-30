import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const distributorId = searchParams.get("distributorId");

  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Missing server credentials." }, { status: 500 });

  let targetId: string | null = distributorId;

  if (!targetId) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      targetId = user?.id ?? null;
    }
  }

  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser();
    targetId = user?.id ?? null;
  }

  if (!targetId) {
    return NextResponse.json({ error: "Distributor ID required." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("profile_distributors")
    .select("id, address, latitude, longitude")
    .eq("id", targetId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    address: data?.address || null,
    latitude: data?.latitude != null ? Number(data.latitude) : null,
    longitude: data?.longitude != null ? Number(data.longitude) : null,
  });
}

export async function POST(request: NextRequest) {
  const admin = createSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Missing server credentials." }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { address, latitude, longitude, distributorId } = body;

  let targetId: string | null = distributorId ? String(distributorId) : null;

  if (!targetId) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      targetId = user?.id ?? null;
    }
  }

  if (!targetId) {
    const { data: { user } } = await supabase.auth.getUser();
    targetId = user?.id ?? null;
  }

  if (!targetId) {
    return NextResponse.json({ error: "Unauthorized or distributor ID missing." }, { status: 401 });
  }

  const cleanAddress = typeof address === "string" ? address.trim() : "";
  const numLat = latitude != null && !isNaN(Number(latitude)) ? Number(latitude) : null;
  const numLng = longitude != null && !isNaN(Number(longitude)) ? Number(longitude) : null;

  const { data, error } = await admin
    .from("profile_distributors")
    .update({
      address: cleanAddress || null,
      latitude: numLat,
      longitude: numLng,
    })
    .eq("id", targetId)
    .select("id, address, latitude, longitude")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    distributorId: targetId,
    address: data?.address || cleanAddress,
    latitude: data?.latitude != null ? Number(data.latitude) : numLat,
    longitude: data?.longitude != null ? Number(data.longitude) : numLng,
  });
}
