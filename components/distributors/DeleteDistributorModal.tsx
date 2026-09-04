"use client";

import type { Distributor } from "@/types/distributor";

type DeleteDistributorModalProps = {
  distributor: Distributor | null;
  deleting: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteDistributorModal({
  distributor,
  deleting,
  error = "",
  onCancel,
  onConfirm,
}: DeleteDistributorModalProps) {
  if (!distributor) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-sm">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-distributor-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h2 id="delete-distributor-title" className="mt-4 text-xl font-black text-gray-900">
          Delete distributor?
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          This permanently removes <strong className="text-gray-700">{distributor.name}</strong> and their distributor login. This action cannot be undone.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Keep account
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
