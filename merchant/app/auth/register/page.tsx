"use client";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "", email: "", favVegetable: "",
    communityName: "", province: "", password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register:", form);
  };

  const provinces = [
    "Phnom Penh", "Siem Reap", "Battambang", "Kampong Cham",
    "Kandal", "Takeo", "Kampot", "Preah Sihanouk",
  ];

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center py-10">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-2">Join as Merchant</h1>
        <p className="text-gray-500 mb-6 text-sm">Create your local vegetable merchant account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Full Name", name: "name", type: "text", placeholder: "Dara Chan" },
            { label: "Gmail", name: "email", type: "email", placeholder: "you@gmail.com" },
            { label: "Favorite Vegetable", name: "favVegetable", type: "text", placeholder: "Morning Glory" },
            { label: "Community Name", name: "communityName", type: "text", placeholder: "Green Farm Community" },
            { label: "Password", name: "password", type: "password", placeholder: "••••••••" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <select
              name="province"
              value={form.province}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">Select province...</option>
              {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Upload</label>
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 bg-white"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Create Account
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-green-600 font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}