"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DistributorSetupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/distributor-login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-[#1b4332]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-[#1b4332]" />
        <p className="text-sm font-semibold text-[#435449]">Redirecting to distributor activation…</p>
      </div>
    </div>
  );
}