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

      await Promise.all(
        ids.map(async (id) => {
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
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(merchantId);
    const isOpenMeta = userData?.user?.user_metadata?.is_open;
    const isOpen = isOpenMeta !== undefined ? Boolean(isOpenMeta) : true;

    return NextResponse.json({ is_open: isOpen });
  } catch (e) {
    return NextResponse.json({ is_open: true });
  }
}
