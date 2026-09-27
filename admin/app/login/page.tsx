"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("adminInfo", JSON.stringify(data));
      router.push("/admin");
    } catch {
      setLoading(false);
      setError("An unexpected connection error occurred.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl bg-white p-8 sm:p-10 border border-[#dfe6d9] shadow-[0_12px_40px_rgba(44,62,31,0.06)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--leaf)] text-white font-black text-sm flex items-center justify-center shadow-md">
            LV
          </div>
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[var(--leaf-accent)]">
              LocalVegetable
            </h2>
            <p className="text-[11px] text-[#7d8b79] font-medium">Control Portal</p>
          </div>
        </div>

        <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-[var(--foreground)] font-heading">
          Admin Sign In
        </h1>
        <p className="mb-6 text-xs text-[#667262] leading-relaxed">
          Authenticate with your administrative credentials to manage marketplace operations.
        </p>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-[#4d5e49] mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              placeholder="admin@localveg.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[#9ca69a] focus:bg-white focus:border-[var(--leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--leaf)]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4d5e49] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[#9ca69a] focus:bg-white focus:border-[var(--leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--leaf)]/20 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--leaf)] hover:bg-[var(--leaf-dark)] py-3.5 text-sm font-extrabold text-white transition-all duration-200 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              <span>Authenticating…</span>
            </>
          ) : (
            "Access Admin Portal"
          )}
        </button>
      </form>
    </main>
  );
}