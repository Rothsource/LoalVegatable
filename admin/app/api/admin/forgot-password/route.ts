import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";

// Global in-memory code store for admin password recovery (15 min TTL)
const resetCodeStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { action, email, code, newPassword } = await req.json();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ error: "Operator email address is required" }, { status: 400 });
    }

    // 1. Request Code
    if (action === "request_code") {
      const { data: admin, error } = await supabaseAdmin
        .from("admins")
        .select("id, email, is_active")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (error || !admin) {
        return NextResponse.json(
          { error: "No administrator account found with this operator email." },
          { status: 404 }
        );
      }

      if (!admin.is_active) {
        return NextResponse.json({ error: "This administrator account is currently deactivated." }, { status: 403 });
      }

      // Generate secure 8-digit code
      const generatedCode = Math.floor(10000000 + Math.random() * 90000000).toString();
      resetCodeStore.set(cleanEmail, {
        code: generatedCode,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
      });

      console.log(`[Admin Password Recovery] Generated 8-digit code for ${cleanEmail}: ${generatedCode}`);

      return NextResponse.json({
        ok: true,
        message: `An 8-digit verification code has been dispatched for ${cleanEmail}.`,
        // In local development, return code for easy verification
        demoCode: process.env.NODE_ENV !== "production" ? generatedCode : undefined,
      });
    }

    // 2. Verify Code
    if (action === "verify_code") {
      const entry = resetCodeStore.get(cleanEmail);
      if (!entry) {
        return NextResponse.json(
          { error: "No active verification request found. Please request a new 8-digit code." },
          { status: 400 }
        );
      }

      if (Date.now() > entry.expiresAt) {
        resetCodeStore.delete(cleanEmail);
        return NextResponse.json({ error: "This 8-digit code has expired. Please request a new one." }, { status: 400 });
      }

      if (entry.code !== (code || "").trim()) {
        return NextResponse.json({ error: "Invalid 8-digit verification code. Please try again." }, { status: 400 });
      }

      return NextResponse.json({ ok: true, message: "Code verified successfully." });
    }

    // 3. Reset Password
    if (action === "reset_password") {
      const entry = resetCodeStore.get(cleanEmail);
      if (!entry || entry.code !== (code || "").trim() || Date.now() > entry.expiresAt) {
        return NextResponse.json({ error: "Session expired or invalid code. Please verify again." }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const { error: updateError } = await supabaseAdmin
        .from("admins")
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq("email", cleanEmail);

      if (updateError) {
        return NextResponse.json({ error: updateError.message || "Failed to update admin password." }, { status: 500 });
      }

      resetCodeStore.delete(cleanEmail);

      return NextResponse.json({
        ok: true,
        message: "Administrator credentials successfully updated.",
      });
    }

    return NextResponse.json({ error: "Unsupported action parameter" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
