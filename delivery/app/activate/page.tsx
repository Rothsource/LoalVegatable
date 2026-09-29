"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Info, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useDelivery } from "@/context/DeliveryProvider";

export default function ActivatePage() {
  const router = useRouter();
  const { startActivation } = useDelivery();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter the Gmail address authorized for your rider account.");
      return;
    }
    setLoading(true);
    const result = await startActivation(email.trim().toLowerCase());
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? "This email is not authorized.");
      return;
    }
    router.push("/verify");
  }

  return (
    <AuthShell step={1}>
      <Link href="/login" className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-bold text-[#765238] hover:text-[#765238]"><ArrowLeft size={16} />Back to login</Link>
      <span className="grid h-14 w-14 place-items-center rounded-[18px] border border-[#e0e5de] bg-[#f6f2ec] text-[#765238]"><MailCheck size={25} /></span>
      <h1 className="mt-6 text-[34px] font-black tracking-[-0.045em] text-[#24382d] sm:text-[40px]">Activate your account</h1>
      <p className="mt-3 text-sm leading-6 text-[#5d685f]">Enter the Gmail address approved for Delivery access. We&apos;ll check it before sending a verification code.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <FormField label="Authorized Gmail" type="email" autoComplete="email" placeholder="name@gmail.com" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} error={error} />
        <Button type="submit" fullWidth loading={loading} icon={<ArrowRight size={18} />} className="!border-[#1b4332] !bg-[#1b4332] shadow-[0_4px_16px_rgba(140,82,40,0.25)] hover:!bg-[#123327]">Continue</Button>
      </form>
      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-[#68746a]"><Info size={14} className="mt-0.5 shrink-0" />In production, account authorization will be checked by the Admin/backend system. This demo uses a local mock service.</p>
    </AuthShell>
  );
}
