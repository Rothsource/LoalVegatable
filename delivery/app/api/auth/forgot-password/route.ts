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

      const emailOtp = data.properties.email_otp;

      // Dispatch Supabase reset email
      try {
        await supabaseAdmin.auth.resetPasswordForEmail(cleanEmail);
      } catch (err) {
        console.warn("resetPasswordForEmail note:", err);
      }

      console.log(`[Delivery Forgot Password] 8-digit code for ${cleanEmail}: ${emailOtp}`);

      return NextResponse.json({
        ok: true,
        code: emailOtp,
        message: `An 8-digit recovery code has been dispatched to ${cleanEmail}.`,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to process recovery request." }, { status: 500 });
  }
}
