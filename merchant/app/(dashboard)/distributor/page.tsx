"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DeleteDistributorModal from "@/components/distributors/DeleteDistributorModal";
import DistributorCard from "@/components/distributors/DistributorCard";
import DistributorFormModal from "@/components/distributors/DistributorFormModal";
import { distributorMatchesSearch } from "@/lib/distributors";
import { supabase } from "@/lib/supabase";
import type {
  Distributor,
  DistributorFormValues,
  DistributorStatus,
} from "@/types/distributor";

type StatusFilter = "All" | DistributorStatus;

type ApiPayload = {
  distributor?: Distributor;
  distributors?: Distributor[];
  error?: string;
  warning?: string | null;
};

async function merchantApi(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("Sign in again to manage distributors.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as ApiPayload;

  if (!response.ok) {
    throw new Error(payload.error || "The distributor request could not be completed.");
  }

  return payload;
}

export default function DistributorPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Distributor | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<Distributor | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadDistributors = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const payload = await merchantApi("/api/merchant/distributors");
      setDistributors(payload.distributors ?? []);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not load distributors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDistributors(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDistributors]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleDistributors = useMemo(
    () =>
      distributors.filter(
        (distributor) =>
          (filter === "All" || distributor.status === filter) &&
          distributorMatchesSearch(distributor, search)
      ),
    [distributors, filter, search]
  );

  const activeCount = distributors.filter((item) => item.status === "Active").length;
  const areasCount = new Set(
    distributors.map((item) => item.deliveryArea.trim().toLowerCase()).filter(Boolean)
  ).size;

  function openCreate() {
    setEditing(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(distributor: Distributor) {
    setEditing(distributor);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setFormError("");
  }

  async function saveDistributor(values: DistributorFormValues) {
    setSaving(true);
    setFormError("");

    try {
      const payload = await merchantApi(
        editing
          ? `/api/merchant/distributors/${encodeURIComponent(editing.id)}`
          : "/api/merchant/distributors",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(values),
        }
      );

      if (!payload.distributor) throw new Error("The server returned an incomplete distributor account.");

      if (editing) {
        setDistributors((current) =>
          current.map((item) =>
            item.id === payload.distributor?.id ? payload.distributor : item
          )
        );
        setNotice(`${payload.distributor.name} was updated.`);
      } else {
        setDistributors((current) => [payload.distributor as Distributor, ...current]);
        setNotice(`${payload.distributor.name} can now sign in as a distributor.`);
      }

      if (payload.warning) setNotice(payload.warning);
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save the distributor.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(distributor: Distributor) {
    const nextStatus: DistributorStatus =
      distributor.status === "Active" ? "Inactive" : "Active";
    setBusyId(distributor.id);
    setPageError("");

    try {
      const payload = await merchantApi(
        `/api/merchant/distributors/${encodeURIComponent(distributor.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      if (!payload.distributor) throw new Error("The server did not return the updated distributor.");

      setDistributors((current) =>
        current.map((item) =>
          item.id === payload.distributor?.id ? payload.distributor : item
        )
      );
      setNotice(`${distributor.name} is now ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not change distributor status.");
    } finally {
      setBusyId("");
    }
  }

  function openDelete(distributor: Distributor) {
    setDeleting(distributor);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError("");

    try {
      const payload = await merchantApi(
        `/api/merchant/distributors/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" }
      );
      setDistributors((current) => current.filter((item) => item.id !== deleting.id));
      setNotice(payload.warning || `${deleting.name} was deleted.`);
      setDeleting(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete the distributor.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div className="absolute -right-14 -top-20 h-52 w-52 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 right-32 h-44 w-44 rounded-full bg-lime-300/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">
              Delivery network
            </p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Distributors</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-green-100">
              Give trusted partners their own login and manage who can distribute your fresh products.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-green-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-green-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14m-7-7h14" />
            </svg>
            Add distributor
          </button>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: distributors.length, color: "text-gray-900" },
          { label: "Active", value: activeCount, color: "text-green-600" },
          { label: "Areas", value: areasCount, color: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {notice && (
        <div role="status" className="mt-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
          </svg>
          {notice}
        </div>
      )}

      {pageError && (
        <div role="alert" className="mt-5 flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <span>{pageError}</span>
          <button type="button" onClick={() => void loadDistributors()} className="flex-shrink-0 font-black underline">
            Retry
          </button>
        </div>
      )}

      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">Your distributor team</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              {visibleDistributors.length} {visibleDistributors.length === 1 ? "account" : "accounts"} shown
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Search distributors</span>
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, area..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100 sm:w-64"
              />
            </label>
            <div className="grid grid-cols-3 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              {(["All", "Active", "Inactive"] as StatusFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filter === item ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="h-11 w-11 rounded-2xl bg-gray-100" />
                <div className="ml-14 -mt-10 h-4 w-36 rounded bg-gray-100" />
                <div className="ml-14 mt-2 h-3 w-48 rounded bg-gray-100" />
                <div className="mt-7 h-16 rounded-xl bg-gray-50" />
              </div>
            ))}
          </div>
        ) : visibleDistributors.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {visibleDistributors.map((distributor) => (
              <DistributorCard
                key={distributor.id}
                distributor={distributor}
                busy={busyId === distributor.id}
                onEdit={openEdit}
                onDelete={openDelete}
                onToggleStatus={(item) => void toggleStatus(item)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-green-200 bg-white px-6 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a4 4 0 0 0-5-4m-2 6H2v-2a6 6 0 0 1 12 0v2Zm-6.5-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9-1a3 3 0 1 0 0-6" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-black text-gray-800">
              {distributors.length === 0 ? "Build your delivery team" : "No matching distributors"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              {distributors.length === 0
                ? "Add your first distributor to create their secure login and assign their delivery area."
                : "Try another search term or status filter."}
            </p>
            {distributors.length === 0 && (
              <button type="button" onClick={openCreate} className="mt-5 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700">
                Add first distributor
              </button>
            )}
          </div>
        )}
      </section>

      {formOpen && (
        <DistributorFormModal
          distributor={editing}
          open
          saving={saving}
          serverError={formError}
          onClose={closeForm}
          onSubmit={saveDistributor}
        />
      )}
      <DeleteDistributorModal
        distributor={deleting}
        deleting={deleteBusy}
        error={deleteError}
        onCancel={() => {
          if (!deleteBusy) setDeleting(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}
