"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PendingPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // poll every 5 seconds to check if approved
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profile_merchants")
        .select("is_approved")
        .eq("id", user.id)
        .single();

      if (data?.is_approved) {
        clearInterval(interval);
        window.location.href = "/home";
      }
    }, 5000);

    setChecking(false);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Waiting for Approval</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your account is under review by our admin team. We'll notify you by email once approved. This page checks automatically every 5 seconds.
        </p>
        {!checking && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Checking approval status...
          </div>
        )}
        <p className="text-gray-400 text-xs mb-4">
          Questions? Contact us at support@localveg.com
        </p>
        <button onClick={handleLogout}
          className="text-sm text-red-500 hover:underline font-semibold">
          Logout
        </button>
      </div>
    </div>
  );
}
