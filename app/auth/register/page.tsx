"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

import AuthShell from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { role: "merchant", full_name: form.name } },
    });

    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md animate-in zoom-in-95 fade-in duration-300 rounded-[2.5rem] border border-gray-100 bg-white p-10 text-center shadow-2xl shadow-emerald-900/5">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
            <span className="text-5xl">📬</span>
          </div>
          <h2 className="mb-3 text-3xl font-black tracking-tight text-gray-900">Check your email!</h2>
          <p className="text-base leading-relaxed text-gray-500">
            We sent a confirmation link to <strong className="font-semibold text-gray-900">{form.email}</strong>.
            Click it to activate your account.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/auth/login" className="rounded-xl bg-gray-50 px-6 py-3.5 text-sm font-bold text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900">
              Return to login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const inputClass = "mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 hover:bg-gray-50 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

  return (
    <AuthShell 
      eyebrow="Join LocalVeg" 
      title="Create account" 
      description="Set up your merchant workspace to start managing deliveries."
      footer={<span>Already have an account? <Link href="/auth/login" className="font-bold text-emerald-600 transition hover:text-emerald-700 hover:underline">Sign in</Link></span>}
    >
      {error && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { label: "Full Name",  name: "name",     type: "text",     placeholder: "E.g. Dara Chan" },
          { label: "Email address",      name: "email",    type: "email",    placeholder: "name@example.com" },
          { label: "Password",   name: "password", type: "password", placeholder: "Choose a secure password" },
        ].map((field) => (
          <div key={field.name}>
            <label className="text-sm font-semibold text-gray-700">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={form[field.name as keyof typeof form]}
              onChange={handleChange}
              placeholder={field.placeholder}
              required
              className={inputClass}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:translate-y-[-1px] hover:from-emerald-500 hover:to-emerald-400 hover:shadow-xl hover:shadow-emerald-500/30 disabled:pointer-events-none disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}