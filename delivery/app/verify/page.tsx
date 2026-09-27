"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, Info, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { useDelivery } from "@/context/DeliveryProvider";
import { DEMO_AUTH } from "@/lib/demo-data";
import { maskEmail } from "@/lib/format";

export default function VerifyPage() {
  const router = useRouter();
  const { activationEmail, verifyCode, resendCode } = useDelivery();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    setError("");
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!pasted.length) return;
    setDigits(Array.from({ length: 6 }, (_, index) => pasted[index] ?? ""));
    refs.current[Math.min(pasted.length, 6) - 1]?.focus();
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter all six digits from your verification code.");
      return;
    }
    setLoading(true);
    const result = await verifyCode(code);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "That code is not valid.");
      return;
    }
    router.push("/set-password");
  }

  async function handleResend() {
    setResending(true);
    const result = await resendCode();
    setResending(false);
    setSeconds(30);
    setMessage(result.message ?? "A new code is ready.");
    setError("");
  }

  return (
    <AuthShell step={2}>
      <Link href="/activate" className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)]"><ArrowLeft size={16} />Change email</Link>
      <span className="grid h-14 w-14 place-items-center rounded-[18px] bg-[var(--surface-soft)] text-[var(--leaf)]"><Mail size={25} /></span>
      <h1 className="mt-6 text-[34px] font-black tracking-[-0.045em] sm:text-[40px]">Check your email</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Enter the 6-digit code sent to <strong className="text-[var(--ink)]">{maskEmail(activationEmail || DEMO_AUTH.authorizedEmail)}</strong>.</p>
      <form onSubmit={handleSubmit} className="mt-8" noValidate>
        <fieldset>
          <legend className="mb-3 text-sm font-bold text-[#344033]">Verification code</legend>
          <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input key={index} ref={(element) => { refs.current[index] = element; }} value={digit} onChange={(event) => setDigit(index, event.target.value)} onKeyDown={(event) => handleKeyDown(index, event)} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} aria-label={`Verification digit ${index + 1}`} maxLength={1} className={`h-14 min-w-0 rounded-[14px] border bg-white text-center text-xl font-black outline-none transition focus:border-[var(--leaf)] focus:ring-4 focus:ring-[#dcebd8] sm:h-16 ${error ? "border-[#da8d86]" : "border-[var(--line)]"}`} />
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-[var(--danger)]"><Info size={14} className="mt-0.5 shrink-0" />{error}</p>}
        {message && <p role="status" className="mt-3 text-xs font-semibold text-[var(--leaf)]">{message}</p>}
        <Button type="submit" fullWidth loading={loading} icon={<ArrowRight size={18} />} className="mt-6">Verify code</Button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--muted)]">
        {seconds > 0 ? <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />Resend in 0:{String(seconds).padStart(2, "0")}</span> : <button type="button" disabled={resending} onClick={handleResend} className="min-h-10 font-extrabold text-[var(--leaf)] hover:underline disabled:opacity-60">{resending ? "Resending…" : "Resend code"}</button>}
      </div>
      <button type="button" onClick={() => { setDigits(DEMO_AUTH.verificationCode.split("")); setError(""); }} className="mt-6 w-full rounded-[18px] border border-[#d8e4d3] bg-[#f2f7ef] p-4 text-center text-sm font-bold text-[var(--leaf-dark)] transition hover:bg-[#ebf4e6]">Use demo code <span className="ml-1 font-black tracking-[0.18em]">{DEMO_AUTH.verificationCode}</span></button>
    </AuthShell>
  );
}
