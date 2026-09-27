// components/distributors/DistributorFormModal.tsx
"use client";

import { FormEvent, useState } from "react";
import { validateDistributorForm } from "@/lib/distributors";
import type { DistributorFormValues } from "@/types/distributor";

type Props = {
  open: boolean;
  saving: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (values: DistributorFormValues) => Promise<void> | void;
};

const EMPTY_FORM: DistributorFormValues = { name: "", email: "" };

export default function DistributorFormModal({ open, saving, serverError = "", onClose, onSubmit }: Props) {
  const [values, setValues] = useState<DistributorFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  if (!open) return null;

  function update<K extends keyof DistributorFormValues>(key: K, value: DistributorFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateDistributorForm(values);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");
    await onSubmit(values);
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-green-400 focus:ring-4 focus:ring-green-100";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl border border-white/60 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-600">Distributor</p>
            <h2 className="mt-1 text-xl font-black text-gray-900">Add a distributor</h2>
            <p className="mt-1 text-sm text-gray-500">
              They'll get a sign-in link after admin approves this request.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="distributor-name" className="text-sm font-bold text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="distributor-name"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
              placeholder="e.g. Sok Dara"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="distributor-email" className="text-sm font-bold text-gray-700">
              Gmail address <span className="text-red-500">*</span>
            </label>
            <input
              id="distributor-email"
              type="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
              placeholder="name@gmail.com"
            />
          </div>

          {(formError || serverError) && (
            <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {formError || serverError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60">
              {saving ? "Sending..." : "Send request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}