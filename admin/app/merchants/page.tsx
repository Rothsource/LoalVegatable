"use client";
import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";

type Merchant = {
  id: string;
  full_name: string;
  community_name: string;
  province: string;
  fav_vegetable: string;
  is_approved: boolean;
  is_verified: boolean;
  created_at: string;
  certificate_url: string;
  profile_url: string;
  background_urls: string[];
};

export default function MerchantsPage() {
  const [merchants, setMerchants]       = useState<Merchant[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<"all" | "pending" | "approved">("pending");
  const [selected, setSelected]         = useState<Merchant | null>(null);

  useEffect(() => { fetchMerchants(); }, []);

  async function fetchMerchants() {
    setLoading(true);
    const res = await fetch("/api/merchants");
    const data = await res.json();
    setMerchants(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleApprove(id: string, approve: boolean) {
    await fetch("/api/merchants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_approved: approve }),
    });
    setMerchants((prev) => prev.map((m) => m.id === id ? { ...m, is_approved: approve } : m));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, is_approved: approve } : null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this merchant account?")) return;
    await fetch("/api/merchants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMerchants((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
  }

  const filtered = merchants.filter((m) => {
    if (filter === "pending")  return !m.is_approved;
    if (filter === "approved") return m.is_approved;
    return true;
  });

  return (
    <AdminLayout title="Merchants">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Merchants</h2>
          <p className="text-gray-500 text-sm mt-1">
            {merchants.filter(m => !m.is_approved).length} pending approval
          </p>
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">

        {/* List */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-semibold">No merchants found</p>
            </div>
          ) : filtered.map((m) => (
            <div key={m.id}
              onClick={() => setSelected(m)}
              className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 cursor-pointer transition hover:shadow-md ${
                selected?.id === m.id ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-100"
              }`}>
              {m.profile_url ? (
                <img src={m.profile_url} alt={m.full_name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg flex-shrink-0">
                  {m.full_name?.[0] ?? "M"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">{m.full_name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    m.is_approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {m.is_approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{m.community_name} · {m.province}</p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">
                {new Date(m.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-96 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 self-start sticky top-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              {selected.profile_url ? (
                <img src={selected.profile_url} alt={selected.full_name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-2xl">
                  {selected.full_name?.[0] ?? "M"}
                </div>
              )}
              <div>
                <p className="font-black text-gray-900 text-lg">{selected.full_name}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  selected.is_approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {selected.is_approved ? "Approved" : "Pending"}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Community</span>
                <span className="font-semibold text-gray-800">{selected.community_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Province</span>
                <span className="font-semibold text-gray-800">{selected.province || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fav Vegetable</span>
                <span className="font-semibold text-gray-800">{selected.fav_vegetable || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Registered</span>
                <span className="font-semibold text-gray-800">
                  {new Date(selected.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Background images */}
            {selected.background_urls?.filter(Boolean).length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Background Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {selected.background_urls.filter(Boolean).map((url, i) => (
                    <img key={i} src={url} alt="" className="w-full h-20 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}

            {/* Certificate */}
            {selected.certificate_url && (
              <a href={selected.certificate_url} target="_blank" rel="noopener noreferrer"
                className="block text-center text-sm text-blue-600 font-semibold hover:underline border border-blue-200 rounded-xl py-2">
                View Certificate
              </a>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              {!selected.is_approved ? (
                <button onClick={() => handleApprove(selected.id, true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm">
                  Approve Merchant
                </button>
              ) : (
                <button onClick={() => handleApprove(selected.id, false)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition text-sm">
                  Revoke Approval
                </button>
              )}
              <button onClick={() => handleDelete(selected.id)}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition text-sm">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}