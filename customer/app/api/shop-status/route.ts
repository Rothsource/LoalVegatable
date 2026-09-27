import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get("merchantId");
  const merchantIdsParam = searchParams.get("merchantIds");

  // Batch query for multiple merchants (used in customer product catalog)
  if (merchantIdsParam) {
    const ids = merchantIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ statuses: {} });
    }

    try {
      const statuses: Record<string, boolean> = {};

      // 1. Check profile_merchants table first
      const { data: profiles } = await supabaseAdmin
        .from("profile_merchants")
        .select("id, is_open")
        .in("id", ids);

      (profiles ?? []).forEach((p: any) => {
        if (p.is_open !== undefined && p.is_open !== null) {
          statuses[p.id] = Boolean(p.is_open);
        }
      });

      // 2. For any merchant not found in table or with null is_open, check auth metadata
      const missing = ids.filter((id) => statuses[id] === undefined);
      await Promise.all(
        missing.map(async (id) => {
          try {
            const { data } = await supabaseAdmin.auth.admin.getUserById(id);
            const isOpenMeta = data?.user?.user_metadata?.is_open;
            statuses[id] = isOpenMeta !== undefined ? Boolean(isOpenMeta) : true;
          } catch {
            statuses[id] = true;
          }
        })
      );

      return NextResponse.json({ statuses });
    } catch (e) {
      return NextResponse.json({ statuses: {} });
    }
  }

  if (!merchantId) {
    return NextResponse.json({ error: "Missing merchantId" }, { status: 400 });
  }

  try {
    // 1. Try auth user metadata
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(merchantId);
    const isOpenMeta = userData?.user?.user_metadata?.is_open;

    // 2. Try profile_merchants table
    const { data: profile } = await supabaseAdmin
      .from("profile_merchants")
      .select("*")
      .eq("id", merchantId)
      .maybeSingle();

    const isOpen = profile?.is_open !== undefined ? profile.is_open : (isOpenMeta !== undefined ? isOpenMeta : true);

    return NextResponse.json({ is_open: Boolean(isOpen) });
  } catch (e) {
    return NextResponse.json({ is_open: true });
  }
}
