"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { PRODUCT_IMAGE_BY_NAME } from "@/lib/productPhotos";

// ── Types ──────────────────────────────────────────────────────────────────────
type Status = "Pending" | "Preparing" | "Ready" | "Delivered" | "Cancelled";

type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  customer: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: Status;
  time: string;
  note?: string;
};

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_FLOW: Status[] = ["Pending", "Preparing", "Ready", "Delivered"];
const DENY_PRESETS = ["Out of stock", "Closed today"];

const INITIAL_ORDERS: Order[] = [
  {
    id: "#0041", customer: "Sophea K.", phone: "012 345 678",
    address: "St. 271, Phnom Penh",
    items: [
      { name: "Tomatoes",      qty: 3, price: 2.00 },
      { name: "Morning Glory", qty: 2, price: 1.50 },
    ],
    total: 9.00, status: "Delivered", time: "2h ago",
    note: "Please no plastic bag",
  },
  {
    id: "#0040", customer: "Dara M.", phone: "017 987 654",
    address: "BKK1, Phnom Penh",
    items: [
      { name: "Spinach",  qty: 2, price: 1.80 },
      { name: "Tomatoes", qty: 1, price: 2.00 },
    ],
    total: 5.60, status: "Pending", time: "4h ago",
  },
  {
    id: "#0039", customer: "Bopha S.", phone: "015 111 222",
    address: "Toul Tom Poung, Phnom Penh",
    items: [{ name: "Morning Glory", qty: 4, price: 1.50 }],
    total: 6.00, status: "Preparing", time: "5h ago",
  },
  {
    id: "#0038", customer: "Vanna T.", phone: "011 333 444",
    address: "Sen Sok, Phnom Penh",
    items: [
      { name: "Tomatoes", qty: 5, price: 2.00 },
      { name: "Spinach",  qty: 1, price: 1.80 },
    ],
    total: 11.80, status: "Delivered", time: "Yesterday",
  },
  {
    id: "#0037", customer: "Maly R.", phone: "016 555 666",
    address: "Chroy Changvar, Phnom Penh",
    items: [
      { name: "Morning Glory", qty: 2, price: 1.50 },
      { name: "Spinach",       qty: 3, price: 1.80 },
    ],
    total: 8.40, status: "Pending", time: "6h ago",
    note: "Ring the bell twice",
  },
  {
    id: "#0036", customer: "Piseth C.", phone: "099 777 888",
    address: "Meanchey, Phnom Penh",
    items: [{ name: "Tomatoes", qty: 2, price: 2.00 }],
    total: 4.00, status: "Cancelled", time: "Yesterday",
  },
];

const STATUS_TABS: { label: string; value: Status | "All" }[] = [
  { label: "All",       value: "All"       },
  { label: "Pending",   value: "Pending"   },
  { label: "Preparing", value: "Preparing" },
  { label: "Ready",     value: "Ready"     },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function statusBadge(status: Status) {
  switch (status) {
    case "Pending":   return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Preparing": return "bg-sky-100 text-sky-700 border border-sky-200";
    case "Ready":     return "bg-violet-100 text-violet-700 border border-violet-200";
    case "Delivered": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Cancelled": return "bg-red-100 text-red-600 border border-red-200";
  }
}

function nextStatus(current: Status): Status | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

function nextStatusLabel(status: Status): string {
  switch (status) {
    case "Pending":   return "Accept & Prepare";
    case "Preparing": return "Mark as Ready";
    case "Ready":     return "Mark as Delivered";
    default:          return "";
  }
}

function nextStatusColor(status: Status): string {
  switch (status) {
    case "Pending":   return "bg-green-600 hover:bg-green-700 text-white";
    case "Preparing": return "bg-sky-600 hover:bg-sky-700 text-white";
    case "Ready":     return "bg-violet-600 hover:bg-violet-700 text-white";
    default:          return "";
  }
}

// ── Product pill ───────────────────────────────────────────────────────────────
function ProductPill({ item }: { item: OrderItem }) {
  return (
    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg pr-2 overflow-hidden">
      <div className="w-6 h-6 flex-shrink-0 overflow-hidden bg-gray-100">
        {PRODUCT_IMAGE_BY_NAME[item.name] ? (
          <img src={PRODUCT_IMAGE_BY_NAME[item.name]} alt={item.name}
            className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-green-100 flex items-center justify-center">
            <span className="text-[8px] text-green-600 font-black">{item.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <span className="text-[10px] font-semibold text-gray-600 whitespace-nowrap">
        {item.name} ×{item.qty}
      </span>
    </div>
  );
}

// ── Close Button (shared) ──────────────────────────────────────────────────────
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 border border-transparent hover:border-red-200 flex items-center justify-center transition-all group flex-shrink-0"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="text-gray-500 group-hover:text-red-500 transition-colors">
        <path d="M18 6 6 18M6 6l12 12"/>
      </svg>
    </button>
  );
}

// ── Deny Modal ─────────────────────────────────────────────────────────────────
function DenyModal({
  order, onConfirm, onClose,
}: {
  order: Order;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected]   = useState("");
  const [custom, setCustom]       = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const reason = useCustom ? custom.trim() : selected;

  // ✅ Escape key closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // ✅ click backdrop to close
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-base font-black text-gray-900">Deny Order</p>
                <p className="text-xs text-gray-400 mt-0.5">{order.id} · {order.customer}</p>
              </div>
            </div>
            <CloseButton onClick={onClose} />
          </div>
        </div>

        {/* body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select a reason</p>

          {DENY_PRESETS.map((preset) => (
            <button key={preset}
              onClick={() => { setSelected(preset); setUseCustom(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                selected === preset && !useCustom
                  ? "border-red-400 bg-red-50 text-red-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  selected === preset && !useCustom ? "border-red-500 bg-red-500" : "border-gray-300"
                }`}>
                  {selected === preset && !useCustom && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                {preset}
              </div>
            </button>
          ))}

          <button
            onClick={() => { setUseCustom(true); setSelected(""); }}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              useCustom
                ? "border-red-400 bg-red-50 text-red-700"
                : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                useCustom ? "border-red-500 bg-red-500" : "border-gray-300"
              }`}>
                {useCustom && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              Custom reason…
            </div>
          </button>

          {useCustom && (
            <textarea
              autoFocus
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Type your reason here…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none placeholder:text-gray-400"
            />
          )}
        </div>

        {/* footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            disabled={!reason}
            onClick={() => reason && onConfirm(reason)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition ${
              reason ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Deny Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order Detail Modal ─────────────────────────────────────────────────────────
function OrderModal({
  order, onUpdateStatus, onDeny, onClose,
}: {
  order: Order;
  onUpdateStatus: (id: string, status: Status) => void;
  onDeny: (order: Order) => void;
  onClose: () => void;
}) {
  const next = nextStatus(order.status);

  // ✅ Escape key closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // ✅ click backdrop to close
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2.5">
              <p className="text-base font-black text-gray-900">{order.id}</p>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusBadge(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{order.time}</p>
          </div>
          {/* ✅ visible close button */}
          <CloseButton onClick={onClose} />
        </div>

        {/* body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* customer */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Customer</p>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 text-xs font-black">{order.customer.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{order.customer}</p>
                  <p className="text-xs text-gray-400">{order.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs text-gray-500">{order.address}</p>
              </div>
              {order.note && (
                <div className="flex items-start gap-2 pt-2 border-t border-gray-200 mt-1">
                  <svg className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <p className="text-xs text-amber-600 font-medium italic">&quot;{order.note}&quot;</p>
                </div>
              )}
            </div>
          </div>

          {/* order items with images */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Order items</p>
            <div className="bg-gray-50 rounded-2xl overflow-hidden">
              {order.items.map((item, i) => (
                <div key={i}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < order.items.length - 1 ? "border-b border-gray-100" : ""
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                      {PRODUCT_IMAGE_BY_NAME[item.name] ? (
                        <img src={PRODUCT_IMAGE_BY_NAME[item.name]} alt={item.name}
                          className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-black text-green-600">{item.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">×{item.qty} · {Math.round(item.price * (item.price < 50 ? 4000 : 1)).toLocaleString()} KHR each</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{Math.round(item.qty * item.price * (item.price < 50 ? 4000 : 1)).toLocaleString()} KHR</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
                <p className="text-sm font-black text-gray-700">Total</p>
                <p className="text-base font-black text-green-600">{Math.round(order.total * (order.total < 100 ? 4000 : 1)).toLocaleString()} KHR</p>
              </div>
            </div>
          </div>

          {/* progress timeline */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Progress</p>
            <div className="flex items-center gap-1">
              {STATUS_FLOW.map((s, i) => {
                const currentIdx = STATUS_FLOW.indexOf(
                  order.status === "Cancelled" ? "Pending" : order.status
                );
                const done    = order.status !== "Cancelled" && i <= currentIdx;
                const current = order.status !== "Cancelled" && i === currentIdx;
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition ${
                        current
                          ? "border-green-500 bg-green-500 text-white"
                          : done
                          ? "border-green-400 bg-green-100 text-green-600"
                          : order.status === "Cancelled"
                          ? "border-red-200 bg-red-50 text-red-300"
                          : "border-gray-200 bg-white text-gray-300"
                      }`}>
                        {done && !current ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : i + 1}
                      </div>
                      <p className={`text-[9px] font-bold text-center leading-tight ${
                        current ? "text-green-600" : done ? "text-green-500" : "text-gray-300"
                      }`}>{s}</p>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 rounded transition ${
                        i < (order.status === "Cancelled" ? -1 : currentIdx) ? "bg-green-300" : "bg-gray-100"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            {order.status === "Cancelled" && (
              <p className="text-xs text-red-500 font-semibold text-center mt-2">
                This order was cancelled
              </p>
            )}
          </div>
        </div>

        {/* footer actions */}
        {(order.status === "Pending" || order.status === "Preparing" || order.status === "Ready") && (
          <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
            {order.status === "Pending" && (
              <button
                onClick={() => onDeny(order)}
                className="flex-1 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold text-red-500 hover:bg-red-50 transition"
              >
                Deny
              </button>
            )}
            {next && (
              <button
                onClick={() => { onUpdateStatus(order.id, next); onClose(); }}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition ${nextStatusColor(order.status)}`}
              >
                {nextStatusLabel(order.status)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders]               = useState<Order[]>(INITIAL_ORDERS);
  const [tab, setTab]                     = useState<Status | "All">("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [denyTarget, setDenyTarget]       = useState<Order | null>(null);

  const filtered     = tab === "All" ? orders : orders.filter((o) => o.status === tab);
  const pendingCount = orders.filter((o) => o.status === "Pending").length;

  const updateStatus = useCallback((id: string, status: Status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setSelectedOrder((prev) => (prev?.id === id ? { ...prev, status } : prev));
  }, []);

  const handleDenyConfirm = useCallback(() => {
    if (!denyTarget) return;
    updateStatus(denyTarget.id, "Cancelled");
    setDenyTarget(null);
    setSelectedOrder(null);
  }, [denyTarget, updateStatus]);

  const closeModal = useCallback(() => setSelectedOrder(null), []);
  const closeDeny  = useCallback(() => setDenyTarget(null), []);

  return (
    <div
      className="min-h-screen bg-[#f5f9f3]"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">

        {/* PAGE HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-gray-900">Orders</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {orders.length} total · {pendingCount} pending
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-sm font-bold text-amber-700">
                {pendingCount} order{pendingCount > 1 ? "s" : ""} waiting for your response
              </p>
            </div>
          )}
        </div>

        {/* STATUS TABS */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((t) => {
            const count = t.value === "All"
              ? orders.length
              : orders.filter((o) => o.status === t.value).length;
            return (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition flex-shrink-0 ${
                  tab === t.value
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}>
                {t.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  tab === t.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ORDER LIST */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-500">
              No {tab === "All" ? "" : tab.toLowerCase()} orders
            </p>
            <p className="text-xs text-gray-400">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const isPending = order.status === "Pending";
              return (
                <div key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all group ${
                    isPending ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-100"
                  }`}>
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black ${
                      isPending ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    }`}>
                      {order.customer.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-black text-gray-400">{order.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(order.status)}`}>
                          {order.status}
                        </span>
                        {order.note && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 border border-amber-100">
                            📝 Note
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-gray-800">{order.customer}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {order.items.map((item, i) => <ProductPill key={i} item={item} />)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-black text-gray-900">{Math.round(order.total * (order.total < 100 ? 4000 : 1)).toLocaleString()} KHR</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{order.time}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition flex-shrink-0"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* quick actions for pending */}
                  {isPending && (
                    <div className="px-5 pb-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDenyTarget(order)}
                        className="flex-1 py-2 rounded-xl border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50 transition"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, "Preparing")}
                        className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-xs font-bold text-white transition"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <OrderModal
          order={orders.find((o) => o.id === selectedOrder.id) ?? selectedOrder}
          onUpdateStatus={updateStatus}
          onDeny={(o) => setDenyTarget(o)}
          onClose={closeModal}
        />
      )}

      {/* DENY MODAL */}
      {denyTarget && (
        <DenyModal
          order={denyTarget}
          onConfirm={handleDenyConfirm}
          onClose={closeDeny}
        />
      )}
    </div>
  );
}
