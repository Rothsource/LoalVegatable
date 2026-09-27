// app/distributor/page.tsx (merchant-side list)
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, Truck, Clock, Plus, ExternalLink, RefreshCw } from "lucide-react";
import DeleteDistributorModal from "@/components/distributors/DeleteDistributorModal";
import DistributorCard from "@/components/distributors/DistributorCard";
import DistributorFormModal from "@/components/distributors/DistributorFormModal";
import { PageHeading } from "@/components/ui/PageHeading";
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
      {/* Top Page Heading */}
      <PageHeading
        eyebrow="Logistics & Dispatch"
        title="Distributor Network"
        description="Certified courier partners who pick up harvested produce and complete doorstep customer deliveries."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/distributors/orders"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#dfe6d9] px-4 py-2.5 text-xs font-bold text-[#182216] hover:bg-[#fafbf9] shadow-xs transition"
            >
              <span>Distributor Portal</span>
              <ExternalLink size={13} className="text-[#2E6F40]" />
            </Link>
            <button
              type="button"
              onClick={() => { setFormError(""); setFormOpen(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2E6F40] hover:bg-[#0A490A] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:shadow transition cursor-pointer"
            >
              <Plus size={15} strokeWidth={3} />
              <span>Add Distributor</span>
            </button>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-[24px] border border-[#dfe6d9] bg-white p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7d8b79]">Total Network</span>
            <div className="w-8 h-8 rounded-lg bg-[#edf6e9] text-[#2E6F40] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-[#182216]">{distributors.length}</p>
          <p className="mt-1 text-xs text-[#7d8b79]">Registered courier partners</p>
        </div>

        <div className="rounded-[24px] border border-[#dfe6d9] bg-white p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">Active Couriers</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Truck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-emerald-700">{activeCount}</p>
          <p className="mt-1 text-xs text-emerald-700/80">Available for order claims</p>
        </div>

        <div className="rounded-[24px] border border-[#dfe6d9] bg-white p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-amber-700">{pendingCount}</p>
          <p className="mt-1 text-xs text-amber-700/80">Awaiting authorization</p>
        </div>
      </section>

      {notice && (
        <div role="status" className="mb-5 rounded-2xl border border-[#c8dfc5] bg-[#edf6e9] px-4 py-3 text-sm font-semibold text-[var(--leaf-dark)] flex items-center justify-between">
          <span>{notice}</span>
        </div>
      )}

      {pageError && (
        <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <span>{pageError}</span>
          <button type="button" onClick={() => void loadDistributors()} className="font-black underline cursor-pointer">Retry</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <section className="mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <p className="text-xs font-black text-[#52604f] uppercase tracking-wider">
            Distributors List ({visibleDistributors.length})
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full rounded-xl border border-[#dfe6d9] bg-white px-3.5 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[#2E6F40] focus:ring-2 focus:ring-[#2E6F40]/10 sm:w-60"
            />
            <div className="grid grid-cols-4 rounded-xl border border-[#dfe6d9] bg-white p-1 card-shadow">
              {(["All", "Pending", "Active", "Inactive"] as StatusFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg py-1 px-2 text-xs font-bold transition cursor-pointer ${
                    filter === item
                      ? "bg-[#2E6F40] text-white shadow-xs"
                      : "text-[#556353] hover:bg-[#fafbf9]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#7d8b79] flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-[#2E6F40]" />
            <span>Loading distributor directory…</span>
          </div>
        ) : visibleDistributors.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleDistributors.map((d) => (
              <DistributorCard key={d.id} distributor={d} busy={busyId === d.id} onDelete={setDeleting} onToggleStatus={(item) => void toggleStatus(item)} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-[#dfe6d9] bg-white px-6 py-14 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf6e9] text-[#2E6F40] mb-3">
              <Truck size={28} />
            </div>
            <h3 className="text-base font-extrabold text-[#182216]">No Distributors Found</h3>
            <p className="mt-1 text-xs text-[#647060] max-w-sm mx-auto">
              {search ? "No couriers match your search query." : "You have not registered any couriers yet. Invite your courier team to claim and deliver orders."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => { setFormError(""); setFormOpen(true); }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#2E6F40] text-white px-4 py-2 text-xs font-extrabold shadow-sm hover:bg-[#0A490A] transition cursor-pointer"
              >
                <Plus size={14} /> Add Distributor
              </button>
            )}
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