"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Check, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useDelivery } from "@/context/DeliveryProvider";

export default function SetPasswordPage() {
  const router = useRouter();
  const { setPassword } = useDelivery();
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Upper and lowercase letters", met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "At least one number", met: /\d/.test(password) },
  ];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!requirements.every((item) => item.met)) {
      setError("Your password does not meet all requirements.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    const result = await setPassword(password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Unable to set your password.");
      return;
    }
    setSuccess(true);
    window.setTimeout(() => router.push("/home"), 900);
  }

  if (success) {
    return (
      <AuthShell step={3}>
        <div className="text-center" role="status">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-[var(--leaf)] text-white shadow-[0_20px_44px_rgba(46,111,64,0.24)]"><CheckCircle2 size={38} /></span>
          <h1 className="mt-7 text-[34px] font-black tracking-[-0.045em]">You&apos;re ready to deliver</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">Your demo rider account is active. Taking you to your delivery dashboard…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell step={3}>
      <span className="grid h-14 w-14 place-items-center rounded-[18px] bg-[var(--surface-soft)] text-[var(--leaf)]"><LockKeyhole size={25} /></span>
      <h1 className="mt-6 text-[34px] font-black tracking-[-0.045em] sm:text-[40px]">Create your password</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Choose a secure password for future Delivery Portal sign-ins.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <FormField label="New password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a password" value={password} onChange={(event) => { setPasswordValue(event.target.value); setError(""); }} trailing={<button type="button" onClick={() => setShowPassword((visible) => !visible)} className="grid h-10 w-10 place-items-center rounded-xl text-[#778373] hover:bg-[#edf3e9]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
        <FormField label="Confirm password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" value={confirm} onChange={(event) => { setConfirm(event.target.value); setError(""); }} error={error} />
        <ul className="grid gap-2 rounded-[18px] bg-[#f1f5ee] p-4 sm:grid-cols-2">
          {requirements.map((item) => <li key={item.label} className={`flex items-center gap-2 text-xs font-bold ${item.met ? "text-[var(--leaf)]" : "text-[#7c8779]"}`}><span className={`grid h-5 w-5 place-items-center rounded-full ${item.met ? "bg-[var(--leaf)] text-white" : "border border-[#c9d2c5] bg-white"}`}>{item.met && <Check size={12} strokeWidth={3} />}</span>{item.label}</li>)}
        </ul>
        <Button type="submit" fullWidth loading={loading}>Activate account</Button>
      </form>
    </AuthShell>
  );
}
