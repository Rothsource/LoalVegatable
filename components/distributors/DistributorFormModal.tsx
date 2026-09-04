"use client";

import { FormEvent, useEffect, useState } from "react";
import { validateDistributorForm } from "@/lib/distributors";
import type { Distributor, DistributorFormValues } from "@/types/distributor";

type DistributorFormModalProps = {
  distributor?: Distributor | null;
  open: boolean;
  saving: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (values: DistributorFormValues) => Promise<void> | void;
};

const EMPTY_FORM: DistributorFormValues = {
  name: "",
  email: "",
  phone: "",
  deliveryArea: "",
  password: "",
  status: "Active",
};

function formFromDistributor(distributor?: Distributor | null): DistributorFormValues {
  if (!distributor) return EMPTY_FORM;

  return {
    name: distributor.name,
    email: distributor.email,
    phone: distributor.phone,
    deliveryArea: distributor.deliveryArea,
    password: "",
    status: distributor.status,
  };
}

export default function DistributorFormModal({
  distributor,
  open,
  saving,
  serverError = "",
  onClose,
  onSubmit,
}: DistributorFormModalProps) {
  const [values, setValues] = useState<DistributorFormValues>(() =>
    formFromDistributor(distributor)
  );
  const [formError, setFormError] = useState("");
  const editing = Boolean(distributor);

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open, saving]);

  if (!open) return null;

  function update<K extends keyof DistributorFormValues>(
    key: K,
    value: DistributorFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateDistributorForm(values, {
      requirePassword: !editing,
    });

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
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="distributor-modal-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/60 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-600">
              Distributor account
            </p>
            <h2 id="distributor-modal-title" className="mt-1 text-xl font-black text-gray-900">
              {editing ? "Edit distributor" : "Add a distributor"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {editing
                ? "Update their contact details, access, or account status."
                : "Create secure access for a trusted delivery partner."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close distributor form"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="distributor-name" className="text-sm font-bold text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="distributor-name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              className={inputClass}
              placeholder="e.g. Sok Dara"
              autoComplete="name"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="distributor-email" className="text-sm font-bold text-gray-700">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="distributor-email"
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              className={inputClass}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="distributor-phone" className="text-sm font-bold text-gray-700">
                Phone number
              </label>
              <input
                id="distributor-phone"
                type="tel"
                value={values.phone}
                onChange={(event) => update("phone", event.target.value)}
                className={inputClass}
                placeholder="+855 12 345 678"
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor="distributor-area" className="text-sm font-bold text-gray-700">
                Delivery area
              </label>
              <input
                id="distributor-area"
                value={values.deliveryArea}
                onChange={(event) => update("deliveryArea", event.target.value)}
                className={inputClass}
                placeholder="e.g. Phnom Penh"
              />
            </div>
          </div>

          <div className={editing ? "grid gap-4 sm:grid-cols-2" : ""}>
            <div>
              <label htmlFor="distributor-password" className="text-sm font-bold text-gray-700">
                {editing ? "New password" : "Temporary password"}{" "}
                {!editing && <span className="text-red-500">*</span>}
              </label>
              <input
                id="distributor-password"
                type="password"
                value={values.password}
                onChange={(event) => update("password", event.target.value)}
                className={inputClass}
                placeholder={editing ? "Leave blank to keep current" : "At least 8 characters"}
                autoComplete="new-password"
                aria-describedby="distributor-password-help"
              />
              <p id="distributor-password-help" className="mt-1.5 text-xs leading-5 text-gray-400">
                {editing ? "Leave blank to keep the current password." : "They can use this once, or verify their email from the distributor setup page to choose a new password."}
              </p>
            </div>

            {editing && (
              <div>
                <label htmlFor="distributor-status" className="text-sm font-bold text-gray-700">
                  Account status
                </label>
                <select
                  id="distributor-status"
                  value={values.status}
                  onChange={(event) =>
                    update("status", event.target.value === "Inactive" ? "Inactive" : "Active")
                  }
                  className={inputClass}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {(formError || serverError) && (
            <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {formError || serverError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create distributor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
