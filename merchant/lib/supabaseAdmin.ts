import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getRequestUser(
  request: NextRequest,
  admin: NonNullable<ReturnType<typeof createSupabaseAdmin>>
) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return { user: null, error: "Sign in before changing account settings.", status: 401 };
  }

  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: "Your session could not be verified.", status: 401 };
  }

  return { user: data.user, error: null, status: 200 };
}
