"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("users").insert([
      {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        provider: "email",
      },
    ]);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Account created successfully! You can now log in.");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 flex flex-col justify-center px-16 bg-white">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome to Local Vegetable
        </h1>
        <p className="text-gray-500 mb-8">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes("Error") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
            <input
              type="text"
              required
              placeholder="Enter your username"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <div className="flex justify-between">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-full transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create an account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <div
        className="w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=800')" }}
      />
    </div>
  );
}