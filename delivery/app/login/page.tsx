"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Info, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useDelivery } from "@/context/DeliveryProvider";
import { DEMO_AUTH } from "@/lib/demo-data";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: sessionLoading } = useDelivery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionLoading && user) router.replace("/home");
  }, [router, sessionLoading, user]);

  function fillDemo() {
    setEmail(DEMO_AUTH.authorizedEmail);
    setPassword(DEMO_AUTH.password);
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "Unable to sign in.");
      return;
    }
    router.push("/home");
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e9f2e4] px-3 py-1.5 text-xs font-extrabold text-[var(--leaf)]"><LockKeyhole size={14} /> Rider access</span>
        <h1 className="mt-5 text-[34px] font-black tracking-[-0.045em] sm:text-[40px]">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Sign in to see your requests and current delivery.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField label="Email address" type="email" autoComplete="email" placeholder="name@gmail.com" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} />
        <FormField label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} trailing={<button type="button" onClick={() => setShowPassword((visible) => !visible)} className="grid h-10 w-10 place-items-center rounded-xl text-[#778373] hover:bg-[#edf3e9]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-[#596655]"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-[var(--leaf)]" />Remember me</label>
          <Link href="/activate" className="text-sm font-extrabold text-[var(--leaf)] hover:underline">Reset access</Link>
        </div>
        {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-[#efd3ce] bg-[#fff7f5] p-3.5 text-sm font-semibold leading-5 text-[var(--danger)]"><Info size={17} className="mt-0.5 shrink-0" />{error}</div>}
        <Button type="submit" fullWidth loading={loading} icon={<ArrowRight size={18} />}>Sign in</Button>
      </form>

      <div className="my-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9aa397]"><span className="h-px flex-1 bg-[var(--line)]" />Demo access<span className="h-px flex-1 bg-[var(--line)]" /></div>
      <button type="button" onClick={fillDemo} className="w-full rounded-[18px] border border-[#d8e4d3] bg-[#f2f7ef] p-4 text-left transition hover:border-[#b9d0af] hover:bg-[#ebf4e6]">
        <span className="flex items-center gap-2 text-sm font-extrabold text-[var(--leaf-dark)]"><Mail size={16} />Use demo rider login</span>
        <span className="mt-2 block break-all text-xs leading-5 text-[var(--muted)]">{DEMO_AUTH.authorizedEmail} · {DEMO_AUTH.password}</span>
      </button>
      <p className="mt-7 text-center text-sm text-[var(--muted)]">First time here? <Link href="/activate" className="font-extrabold text-[var(--leaf)] hover:underline">Activate your account</Link></p>
    </AuthShell>
  );
}
