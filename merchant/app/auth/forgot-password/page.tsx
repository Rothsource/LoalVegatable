"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-2">Forgot Password</h1>
        <p className="text-gray-500 mb-6 text-sm">
          {step === "email" ? "Enter your Gmail to receive an OTP" : `OTP sent to ${email}`}
        </p>
        {step === "email" ? (
          <form onSubmit={(e) => { e.preventDefault(); setStep("otp"); }} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); console.log("OTP:", otp); }} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 bg-white text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Verify OTP
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-sm text-gray-500 hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/auth/login" className="text-green-600 hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
