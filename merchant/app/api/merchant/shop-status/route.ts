import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get("merchantId");
  const distributorId = searchParams.get("distributorId");

  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ is_open: true });
  }

  try {
    let targetMerchantId = merchantId;

    // If distributorId is supplied, resolve the linked merchant
    if (!targetMerchantId && distributorId) {
      const { data: dist } = await admin
        .from("profile_distributors")
        .select("merchant_id, status")
        .eq("id", distributorId)
        .maybeSingle();

      if (dist?.merchant_id) {
        targetMerchantId = dist.merchant_id;
      } else {
        // Fallback to distributor status
        const isDistOpen = dist?.status ? dist.status.toLowerCase() === "active" : true;
        return NextResponse.json({ is_open: isDistOpen });
      }
    }

    if (!targetMerchantId) {
      return NextResponse.json({ error: "Missing merchantId or distributorId" }, { status: 400 });
    }

    // Check auth user metadata
    const { data: userData } = await admin.auth.admin.getUserById(targetMerchantId);
    const isOpenMeta = userData?.user?.user_metadata?.is_open;

    // Check if profile_merchants has is_open column
    const { data: profile } = await admin
      .from("profile_merchants")
      .select("*")
      .eq("id", targetMerchantId)
      .maybeSingle();

    const isOpen = profile?.is_open !== undefined ? profile.is_open : (isOpenMeta !== undefined ? isOpenMeta : true);

    return NextResponse.json({ is_open: Boolean(isOpen), merchantId: targetMerchantId });
  } catch (err: any) {
    return NextResponse.json({ is_open: true });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  const { data: sessionData, error: authError } = await supabase.auth.getUser(token);
  const user = sessionData?.user;

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const isOpen = Boolean(body.isOpen);

  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin credentials missing" }, { status: 500 });
  }

  try {
    // 1. Check if the caller is a Merchant
    const { data: merchantProfile } = await admin
      .from("profile_merchants")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (merchantProfile) {
      // Caller is Merchant:
      // A. Update merchant metadata & profile
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          is_open: isOpen,
        },
      });

      try {
        await admin.from("profile_merchants").update({ is_open: isOpen }).eq("id", user.id);
      } catch {}

      // B. BIDIRECTIONAL SYNC: Update all linked distributors
      const { data: linkedDists } = await admin
        .from("profile_distributors")
        .select("id")
        .eq("merchant_id", user.id);

      if (linkedDists && linkedDists.length > 0) {
        for (const dist of linkedDists) {
          // Update profile_distributors table
          try {
            await admin
              .from("profile_distributors")
              .update({
                status: isOpen ? "Active" : "Inactive",
                is_open: isOpen,
              })
              .eq("id", dist.id);
          } catch {
            await admin
              .from("profile_distributors")
              .update({
                status: isOpen ? "Active" : "Inactive",
              })
              .eq("id", dist.id);
          }

          // Update distributor auth user metadata
          try {
            const { data: distUser } = await admin.auth.admin.getUserById(dist.id);
            if (distUser?.user) {
              await admin.auth.admin.updateUserById(dist.id, {
                user_metadata: {
                  ...distUser.user.user_metadata,
                  is_open: isOpen,
                  status: isOpen ? "Active" : "Inactive",
                },
              });
            }
          } catch {}
        }
      }

      return NextResponse.json({
        ok: true,
        is_open: isOpen,
        role: "merchant",
        synced_distributors: linkedDists?.length ?? 0,
      });
    }

    // 2. Check if caller is a Distributor
    const { data: distProfile } = await admin
      .from("profile_distributors")
      .select("id, merchant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (distProfile) {
      // Caller is Distributor:
      // A. Update distributor's own status
      try {
        await admin
          .from("profile_distributors")
          .update({
            status: isOpen ? "Active" : "Inactive",
            is_open: isOpen,
          })
          .eq("id", user.id);
      } catch {
        await admin
          .from("profile_distributors")
          .update({
            status: isOpen ? "Active" : "Inactive",
          })
          .eq("id", user.id);
      }

      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          is_open: isOpen,
          status: isOpen ? "Active" : "Inactive",
        },
      });

      // B. BIDIRECTIONAL SYNC: Synchronize linked Merchant & sibling distributors
      if (distProfile.merchant_id) {
        // Update linked merchant
        try {
          await admin
            .from("profile_merchants")
            .update({ is_open: isOpen })
            .eq("id", distProfile.merchant_id);
        } catch {}

        try {
          const { data: merchantUser } = await admin.auth.admin.getUserById(distProfile.merchant_id);
          if (merchantUser?.user) {
            await admin.auth.admin.updateUserById(distProfile.merchant_id, {
              user_metadata: {
                ...merchantUser.user.user_metadata,
                is_open: isOpen,
              },
            });
          }
        } catch {}

        // Update all other sibling distributors under this merchant
        const { data: siblingDists } = await admin
          .from("profile_distributors")
          .select("id")
          .eq("merchant_id", distProfile.merchant_id);

        if (siblingDists) {
          for (const sibling of siblingDists) {
            if (sibling.id === user.id) continue;
            try {
              await admin
                .from("profile_distributors")
                .update({
                  status: isOpen ? "Active" : "Inactive",
                  is_open: isOpen,
                })
                .eq("id", sibling.id);
            } catch {}
          }
        }
      }

      return NextResponse.json({
        ok: true,
        is_open: isOpen,
        role: "distributor",
        synced_merchant_id: distProfile.merchant_id,
      });
    }

    // Default: update user metadata
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        is_open: isOpen,
      },
    });

    return NextResponse.json({ ok: true, is_open: isOpen });
  } catch (error: any) {
    console.error("Shop status toggle error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update status" }, { status: 500 });
  }
}
