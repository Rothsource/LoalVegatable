import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { action, email } = await req.json();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid courier email address." }, { status: 400 });
    }

    if (action === "request_code") {
      // Check if courier account exists
      const { data, error: genError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: cleanEmail,
      });

      if (genError || !data?.properties) {
        return NextResponse.json(
          { error: genError?.message || "No registered courier account found with this email." },
          { status: 404 }
        );
      }

      // Dispatch Supabase reset email to courier inbox
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(cleanEmail);
      if (resetError) {
        console.error("resetPasswordForEmail error:", resetError);
        return NextResponse.json(
          { error: resetError.message || "Failed to send verification code to your email." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `An 8-digit recovery code has been sent to ${cleanEmail}. Please check your email inbox.`,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to process recovery request." }, { status: 500 });
  }
}
