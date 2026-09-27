"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DistributorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });

    setSending(false);
    if (otpError) return setError(otpError.message);
    setStage("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });

    setVerifying(false);
    if (verifyError) return setError(verifyError.message);

    router.replace("/distributors/products");
  }

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <h1 className="text-xl font-bold text-gray-900">Distributor Sign In</h1>

        {stage === "email" ? (
          <>
            <p className="mt-1 text-sm text-gray-500">Enter your Gmail to get a sign-in code.</p>
            <form onSubmit={sendCode} className="mt-6 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className={inputClass}
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-500">
              Enter the code sent to <span className="font-semibold text-gray-700">{email}</span>.
            </p>
            <form onSubmit={verifyCode} className="mt-6 space-y-4">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="8-digit code"
                className={inputClass}
                maxLength={8}
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={verifying}
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Verify & sign in"}
              </button>
              <button
                type="button"
                onClick={() => { setStage("email"); setCode(""); setError(""); }}
                className="w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                Use a different email
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}