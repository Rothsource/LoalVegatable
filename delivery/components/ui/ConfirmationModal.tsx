"use client";

import { useEffect, useRef } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ConfirmationModalProps = {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationModal({ open, loading, onCancel, onConfirm }: ConfirmationModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#142012]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && !loading && onCancel()}>
      <section className="enter-up bottom-safe w-full max-w-md rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="arrival-title" aria-describedby="arrival-description">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-soft)] text-[var(--leaf)]">
            <MapPin size={23} aria-hidden="true" />
          </span>
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="grid h-11 w-11 place-items-center rounded-xl text-[var(--muted)] transition hover:bg-[#f1f4ee]" aria-label="Close arrival confirmation">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <h2 id="arrival-title" className="mt-5 text-xl font-black tracking-[-0.03em]">Confirm your arrival?</h2>
        <p id="arrival-description" className="mt-2 text-sm leading-6 text-[var(--muted)]">Only confirm after you have reached the customer&apos;s destination. This will complete the demo delivery.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirm} loading={loading}>Confirm arrival</Button>
        </div>
      </section>
    </div>
  );
}
