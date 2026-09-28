"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Authentication failed. Check your administrative credentials.");
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("adminInfo", JSON.stringify(data));
      router.push("/admin");
    } catch {
      setLoading(false);
      setError("An unexpected connection error occurred. Check your network link.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#d9dfd8] bg-white px-3.5 py-3 text-sm text-[#24382d] placeholder:text-[#7a857c] outline-none transition focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/15";

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 text-[#24382d]">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#e3e7e1] bg-white p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image/logo.png" alt="LocalVegetable" className="h-full w-full object-contain" />
          </div>
          <span className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#765238]">
            Central Operations
          </span>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#20382b]">
            Admin Console Sign In
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5d685f]">
            Administrative control for produce catalog, merchant reviews, and fleet operations.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-xl border border-[#e3e7e1] bg-white p-6 shadow-[0_14px_40px_rgba(28,54,39,0.07)] sm:p-8"
        >
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium leading-relaxed text-red-800"
            >
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#35473a]">
                Operator Email Address
              </label>
              <div className="mt-1.5">
                <input
                  aria-label="Operator email address"
                  type="email"
                  placeholder="admin@localveg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-[#35473a]">
                  Secret Key / Password
                </label>
              </div>
              <div className="relative mt-1.5">
                <input
                  aria-label="Secret key or password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66746a] transition hover:text-[#1b4332]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Authenticating console access…</span>
              </>
            ) : (
              <span>Access Admin Console</span>
            )}
          </button>

        </form>

        <p className="mt-5 text-center text-xs text-[#68746a]">
          Authorized administrative personnel only · Activity logged & monitored
        </p>
      </div>
    </main>
  );
}