"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useDelivery } from "@/context/DeliveryProvider";

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
      <div className="mb-7">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#24382d] sm:text-4xl">
          Rider sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5d685f]">
          Sign in to access assigned farm manifests, route coordinates, and live delivery updates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label="Courier Email Address"
          type="email"
          autoComplete="email"
          placeholder="rider@localveg.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
        />

        <FormField
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your rider password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="grid h-10 w-10 place-items-center rounded-xl text-[#68746a] transition hover:bg-[#f6f7f3] hover:text-[#24382d]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="flex items-center justify-between gap-4 py-1">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#5d685f]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded accent-[#1b4332]"
            />
            Keep me signed in
          </label>
          <Link href="/forgot-password" className="text-xs font-bold text-[#765238] transition hover:text-[#765238] hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-xs font-semibold leading-relaxed text-[#991b1b]">
            <Info size={16} className="mt-0.5 shrink-0 text-[#b91c1c]" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          loading={loading}
          icon={<ArrowRight size={17} />}
          className="!border-[#1b4332] !bg-[#1b4332] shadow-[0_4px_16px_rgba(140,82,40,0.25)] hover:!bg-[#123327]"
        >
          Sign in to Rider Dashboard
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-[#68746a]">
        First time driving with us?{" "}
        <Link href="/activate" className="font-bold text-[#765238] hover:text-[#765238] hover:underline">
          Activate courier account
        </Link>
      </p>
    </AuthShell>
  );
}
