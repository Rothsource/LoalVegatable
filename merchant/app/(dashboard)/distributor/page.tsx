// app/distributor/page.tsx (merchant-side list)
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DeleteDistributorModal from "@/components/distributors/DeleteDistributorModal";
import DistributorCard from "@/components/distributors/DistributorCard";
import DistributorFormModal from "@/components/distributors/DistributorFormModal";
import { distributorMatchesSearch } from "@/lib/distributors";
import { supabase } from "@/lib/supabase";
import type { Distributor, DistributorFormValues, DistributorStatus } from "@/types/distributor";

type StatusFilter = "All" | DistributorStatus;
type ApiPayload = { distributor?: Distributor; distributors?: Distributor[]; error?: string; warning?: string | null };

async function merchantApi(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in again to manage distributors.");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json().catch(() => ({}))) as ApiPayload;
  if (!response.ok) throw new Error(payload.error || "The distributor request could not be completed.");
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

  useEffect(() => { void loadDistributors(); }, [loadDistributors]);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const visibleDistributors = useMemo(
    () => distributors.filter((d) => (filter === "All" || d.status === filter) && distributorMatchesSearch(d, search)),
    [distributors, filter, search]
  );

  const activeCount = distributors.filter((d) => d.status === "Active").length;
  const pendingCount = distributors.filter((d) => d.status === "Pending").length;

  async function saveDistributor(values: DistributorFormValues) {
    setSaving(true);
    setFormError("");
    try {
      const payload = await merchantApi("/api/merchant/distributors", {
        method: "POST",
        body: JSON.stringify(values),
      });
      if (!payload.distributor) throw new Error("The server returned an incomplete distributor account.");
      setDistributors((current) => [payload.distributor as Distributor, ...current]);
      setNotice(`Request sent for ${payload.distributor.name}. Waiting on admin approval.`);
      setFormOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save the distributor.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(distributor: Distributor) {
    const nextStatus: DistributorStatus = distributor.status === "Active" ? "Inactive" : "Active";
    setBusyId(distributor.id);
    setPageError("");
    try {
      const payload = await merchantApi(`/api/merchant/distributors/${encodeURIComponent(distributor.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!payload.distributor) throw new Error("The server did not return the updated distributor.");
      setDistributors((current) => current.map((d) => (d.id === payload.distributor?.id ? payload.distributor : d)));
      setNotice(`${distributor.name} is now ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not change distributor status.");
    } finally {
      setBusyId("");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const payload = await merchantApi(`/api/merchant/distributors/${encodeURIComponent(deleting.id)}`, { method: "DELETE" });
      setDistributors((current) => current.filter((d) => d.id !== deleting.id));
      setNotice(payload.warning || `${deleting.name} was removed.`);
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
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">Stock network</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Distributors</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-green-100">
              Invite a trusted person to monitor and update stock for you. Admin approval is required.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setFormError(""); setFormOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-green-800 shadow-sm hover:bg-green-50"
          >
            + Add distributor
          </button>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: distributors.length, color: "text-gray-900" },
          { label: "Active", value: activeCount, color: "text-green-600" },
          { label: "Pending", value: pendingCount, color: "text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-5">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {notice && <div role="status" className="mt-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">{notice}</div>}
      {pageError && (
        <div role="alert" className="mt-5 flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <span>{pageError}</span>
          <button type="button" onClick={() => void loadDistributors()} className="font-black underline">Retry</button>
        </div>
      )}

      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-400">{visibleDistributors.length} shown</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email..."
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 sm:w-64"
            />
            <div className="grid grid-cols-4 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              {(["All", "Pending", "Active", "Inactive"] as StatusFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filter === item ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-gray-400">Loading...</p>
        ) : visibleDistributors.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {visibleDistributors.map((d) => (
              <DistributorCard key={d.id} distributor={d} busy={busyId === d.id} onDelete={setDeleting} onToggleStatus={(item) => void toggleStatus(item)} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-green-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm text-gray-500">No distributors yet.</p>
          </div>
        )}
      </section>

      {formOpen && (
        <DistributorFormModal open saving={saving} serverError={formError} onClose={() => setFormOpen(false)} onSubmit={saveDistributor} />
      )}
      <DeleteDistributorModal
        distributor={deleting}
        deleting={deleteBusy}
        error={deleteError}
        onCancel={() => { if (!deleteBusy) setDeleting(null); }}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}