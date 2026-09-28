"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  Eye, Search, RefreshCw, X, MapPin, Phone, Mail, 
  Calendar, CheckCircle2, Clock, Truck, ShieldCheck, 
  AlertCircle, ShoppingBag, Store, ExternalLink, Copy, 
  Check, Lock, ArrowUpRight
} from "lucide-react";

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  unit: string;
  img: string;
  merchant_id: string | null;
  merchant_name: string;
  merchant_province: string;
  merchant_phone: string;
};

export type OrderCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
};

export type OrderAddress = {
  id: string;
  street: string | null;
  province: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  recipient_name: string | null;
};

export type OrderDelivery = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type AdminOrder = {
  id: string;
  created_at: string;
  updated_at: string | null;
  accepted_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  status: string;
  payment_status: string;
  total_amount: number;
  notes: string | null;
  items: OrderItem[];
  item_count: number;
  merchants: string[];
  customer: OrderCustomer;
  address: OrderAddress | null;
  delivery: OrderDelivery | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load orders");
      }
      setOrders(json.orders || []);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      setError(err.message || "Network error loading orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.payment_status === "paid" && o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const activeOrders = orders.filter((o) =>
      ["pending", "accepted", "out_for_delivery", "delivering"].includes(o.status)
    ).length;
    const refundedOrders = orders.filter(
      (o) => o.payment_status === "refunded" || o.status === "cancelled"
    ).length;

    return { totalOrders, totalRevenue, activeOrders, refundedOrders };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customer.name.toLowerCase().includes(q) ||
        (order.customer.email && order.customer.email.toLowerCase().includes(q)) ||
        (order.customer.phone && order.customer.phone.includes(q)) ||
        order.merchants.some((m) => m.toLowerCase().includes(q)) ||
        order.items.some((i) => i.product_name.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && order.status === "pending") ||
        (statusFilter === "accepted" && order.status === "accepted") ||
        (statusFilter === "delivering" &&
          (order.status === "out_for_delivery" || order.status === "delivering")) ||
        (statusFilter === "delivered" && order.status === "delivered") ||
        (statusFilter === "cancelled" && order.status === "cancelled");

      const matchPayment =
        paymentFilter === "all" || order.payment_status === paymentFilter;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, search, statusFilter, paymentFilter]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return {
          label: "Delivered",
          classes: "bg-[#edf6e9] text-[#1b4332] border-[#c8dfc5]",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case "out_for_delivery":
      case "delivering":
        return {
          label: "Out for Delivery",
          classes: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]",
          icon: <Truck className="w-3.5 h-3.5" />,
        };
      case "accepted":
        return {
          label: "Merchant Accepted",
          classes: "bg-[#eff6ef] text-[#0A490A] border-[#cce8cc]",
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
        };
      case "cancelled":
        return {
          label: "Cancelled / Declined",
          classes: "bg-[#fef2f2] text-[#be123c] border-[#fecdd3]",
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
      case "pending":
      default:
        return {
          label: "Pending Acceptance",
          classes: "bg-[#fef8ea] text-[#935b0b] border-[#f4dfab]",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return {
          label: "Paid",
          classes: "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]",
        };
      case "refunded":
        return {
          label: "Refunded",
          classes: "bg-[#fdf2f8] text-[#9d174d] border-[#fbcfe8]",
        };
      case "pending":
      default:
        return {
          label: "Unpaid / Pending",
          classes: "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
        };
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#edf6e9] text-[#1b4332] border border-[#c8dfc5]">
              <Lock className="w-3 h-3 text-[var(--leaf)]" /> Read-Only Mode
            </span>
          </div>
          <h2 className="text-3xl font-black text-[var(--foreground)] font-heading">
            Platform Orders
          </h2>
          <p className="mt-1 text-sm text-[#667262]">
            Inspect live customer harvest transactions, merchant fulfillment, and payment records.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[#dfe6d9] bg-white px-4 py-2.5 text-xs font-bold text-[#556353] shadow-2xs hover:bg-[#fafbf9] hover:text-[var(--foreground)] transition-all cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[var(--leaf)]" : ""}`} />
          Refresh Orders
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-[#dfe6d9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d8b79] uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#edf6e9] text-[var(--leaf-dark)] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-[var(--foreground)] font-heading">
            {stats.totalOrders}
          </div>
          <p className="mt-1 text-xs text-[#8a9987]">All logged transactions</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-[#dfe6d9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d8b79] uppercase tracking-wider">
              Settled Volume
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] text-[#065f46] flex items-center justify-center">
              <span className="font-extrabold text-xs">KHR</span>
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-[var(--foreground)] font-heading truncate">
            {stats.totalRevenue.toLocaleString()} <span className="text-sm font-bold text-[#7d8b79]">KHR</span>
          </div>
          <p className="mt-1 text-xs text-[#8a9987]">Verified paid harvest sales</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-[#dfe6d9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d8b79] uppercase tracking-wider">
              Active Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-[var(--foreground)] font-heading">
            {stats.activeOrders}
          </div>
          <p className="mt-1 text-xs text-[#8a9987]">Preparing or en route</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-[#dfe6d9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7d8b79] uppercase tracking-wider">
              Cancelled / Refunded
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#fdf2f8] text-[#be123c] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-[var(--foreground)] font-heading">
            {stats.refundedOrders}
          </div>
          <p className="mt-1 text-xs text-[#8a9987]">Returned or voided orders</p>
        </div>
      </div>

      {/* Main Order Roster Container */}
      <div className="rounded-2xl bg-white p-6 border border-[#dfe6d9] shadow-sm">
        {/* Search & Filters */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">
              Order Directory
            </h3>
            <span className="text-xs text-[#7d8b79]">
              Showing {filteredOrders.length} of {orders.length} platform orders
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-[#9ca69a] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ID, customer, farm, item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6d9] bg-[#fafbf9] pl-9 pr-4 py-2 text-sm text-[var(--foreground)] placeholder-[#9ca69a] focus:bg-white focus:border-[var(--leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--leaf)]/20 transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] focus:bg-white focus:border-[var(--leaf)] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Acceptance</option>
              <option value="accepted">Merchant Accepted</option>
              <option value="delivering">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled / Refunded</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] focus:bg-white focus:border-[var(--leaf)] focus:outline-none cursor-pointer"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid First</option>
              <option value="refunded">Refunded</option>
              <option value="pending">Pending Payment</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 rounded-full border-3 border-[#dfe6d9] border-t-[var(--leaf)] animate-spin" />
            <span className="text-xs font-bold text-[var(--leaf-accent)] uppercase tracking-wider">
              Loading platform orders…
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#dfe6d9] text-[11px] font-extrabold text-[#7d8b79] uppercase tracking-wider">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Produce Items</th>
                  <th className="py-3 px-3">Total (KHR)</th>
                  <th className="py-3 px-3">Fulfillment</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Inspection</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f2f4ef] text-sm">
                {filteredOrders.map((order) => {
                  const statusConfig = getStatusBadge(order.status);
                  const paymentConfig = getPaymentBadge(order.payment_status);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-[#fafbf9] transition-colors cursor-pointer group"
                    >
                      {/* Order ID */}
                      <td className="py-4 px-3 font-mono font-bold text-xs text-[var(--foreground)]">
                        <span className="px-2 py-1 rounded bg-[#f3f5f0] border border-[#e5e9df] text-[var(--foreground)] group-hover:border-[var(--leaf)] transition-colors">
                          #{order.id.slice(0, 8)}
                        </span>
                      </td>

                      {/* Placed Date */}
                      <td className="py-4 px-3 text-xs text-[#556353] whitespace-nowrap">
                        <div className="font-semibold text-[var(--foreground)]">
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-[#8a9987]">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-3">
                        <div className="font-bold text-xs text-[var(--foreground)]">
                          {order.customer.name}
                        </div>
                        <div className="text-[11px] text-[#7d8b79] truncate max-w-[150px]">
                          {order.customer.phone || order.customer.email || "No direct phone"}
                        </div>
                      </td>

                      {/* Produce items summary */}
                      <td className="py-4 px-3">
                        <div className="text-xs font-semibold text-[var(--foreground)] truncate max-w-[200px]">
                          {order.items.length > 0
                            ? order.items
                                .map((i) => `${i.product_name} (${i.quantity} ${i.unit})`)
                                .join(", ")
                            : "Standard Harvest Order"}
                        </div>
                        <div className="text-[11px] text-[var(--leaf-accent)] font-bold">
                          {order.item_count || order.items.length} total units
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="font-black text-sm text-[var(--foreground)]">
                          {order.total_amount.toLocaleString()}{" "}
                          <span className="text-[11px] font-bold text-[#7d8b79]">KHR</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${statusConfig.classes}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${paymentConfig.classes}`}
                        >
                          {paymentConfig.label}
                        </span>
                      </td>

                      {/* Action: See Detail */}
                      <td className="py-4 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#eff6ef] border border-[#dfe6d9] hover:border-[var(--leaf)] text-xs font-bold text-[var(--foreground)] hover:text-[var(--leaf-dark)] shadow-2xs transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[var(--leaf)]" />
                          <span>See Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredOrders.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-[#f4f7f0] text-[#7d8b79] flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[var(--foreground)]">No matching orders</h4>
                <p className="text-xs text-[#8a9987] mt-1">
                  Try adjusting your search terms or filter selection.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* READ-ONLY ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-[#dfe6d9] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="p-6 border-b border-[#dfe6d9] flex items-start justify-between bg-[#fbf8f2]/90">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#dfe6d9] p-1.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                  <img src="/image/logo.png" alt="LocalVegetable" className="h-full w-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-[var(--foreground)] font-heading">
                      Order #{selectedOrder.id.slice(0, 8)}
                    </h3>
                    <button
                      onClick={() => handleCopyId(selectedOrder.id)}
                      title="Copy full Order UUID"
                      className="p-1 rounded-md text-[#7d8b79] hover:text-[var(--foreground)] hover:bg-white border border-transparent hover:border-[#dfe6d9] transition-all cursor-pointer"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#eff6ef] text-[var(--leaf-dark)] border border-[#cce8cc]">
                      <Lock className="w-2.5 h-2.5" /> Read-Only
                    </span>
                  </div>
                  <p className="text-xs text-[#7d8b79] mt-0.5">
                    Placed on {new Date(selectedOrder.created_at).toLocaleString("en-US", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-xl border border-[#dfe6d9] bg-white hover:bg-rose-50 hover:border-rose-200 text-[#7d8b79] hover:text-rose-700 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Status Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#fafbf9] border border-[#e5e9df]">
                  <div className="text-[11px] font-bold text-[#7d8b79] uppercase tracking-wider mb-1.5">
                    Fulfillment Status
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                        getStatusBadge(selectedOrder.status).classes
                      }`}
                    >
                      {getStatusBadge(selectedOrder.status).icon}
                      {getStatusBadge(selectedOrder.status).label}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#fafbf9] border border-[#e5e9df]">
                  <div className="text-[11px] font-bold text-[#7d8b79] uppercase tracking-wider mb-1.5">
                    Payment Verification
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${
                        getPaymentBadge(selectedOrder.payment_status).classes
                      }`}
                    >
                      {getPaymentBadge(selectedOrder.payment_status).label}
                    </span>
                    <span className="text-xs font-bold text-[var(--foreground)]">
                      {selectedOrder.total_amount.toLocaleString()} KHR
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer & Destination Info */}
              <div className="rounded-2xl border border-[#dfe6d9] p-5 bg-white">
                <h4 className="text-xs font-extrabold text-[#7d8b79] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[var(--leaf)]" /> Customer & Delivery Destination
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] text-[#8a9987]">Customer Name</div>
                    <div className="font-bold text-sm text-[var(--foreground)] mt-0.5">
                      {selectedOrder.customer.name}
                    </div>

                    {selectedOrder.customer.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-[#556353] mt-2">
                        <Phone className="w-3.5 h-3.5 text-[#8a9987]" />
                        <span>{selectedOrder.customer.phone}</span>
                      </div>
                    )}

                    {selectedOrder.customer.email && (
                      <div className="flex items-center gap-1.5 text-xs text-[#556353] mt-1">
                        <Mail className="w-3.5 h-3.5 text-[#8a9987]" />
                        <span>{selectedOrder.customer.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] text-[#8a9987]">Delivery Address</div>
                    <div className="font-semibold text-xs text-[var(--foreground)] mt-0.5">
                      {selectedOrder.address?.street || selectedOrder.customer.location || "Street address on file"}
                    </div>
                    <div className="text-xs text-[#556353] font-bold mt-1">
                      {selectedOrder.address?.province || "Cambodia"}
                    </div>

                    {selectedOrder.address?.lat != null && selectedOrder.address?.lng != null && (
                      <div className="mt-2.5">
                        <a
                          href={`https://www.google.com/maps?q=${selectedOrder.address.lat},${selectedOrder.address.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--leaf-dark)] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Pin: {selectedOrder.address.lat.toFixed(5)}, {selectedOrder.address.lng.toFixed(5)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Produce Order Items Table (Read-Only) */}
              <div className="rounded-2xl border border-[#dfe6d9] overflow-hidden bg-white">
                <div className="px-5 py-3.5 bg-[#fbf8f2] border-b border-[#dfe6d9] flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#7d8b79] uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-[var(--leaf)]" /> Harvest Items & Merchant Breakdown
                  </h4>
                  <span className="text-xs font-bold text-[var(--leaf-accent)]">
                    {selectedOrder.items.length} {selectedOrder.items.length === 1 ? "Product" : "Products"}
                  </span>
                </div>

                <div className="divide-y divide-[#f2f4ef]">
                  {selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-[#fafbf9] transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-[#f4f7f0] border border-[#dfe6d9] overflow-hidden shrink-0 flex items-center justify-center">
                          {item.img ? (
                            <img src={item.img} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-[#8a9987]" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-[var(--foreground)] truncate">
                            {item.product_name}
                          </div>
                          <div className="text-xs text-[#7d8b79] flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-[var(--leaf-dark)]">{item.merchant_name}</span>
                            {item.merchant_province && <span>· {item.merchant_province}</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs text-[#7d8b79]">
                            {item.quantity} {item.unit} × {item.unit_price.toLocaleString()} KHR
                          </div>
                          <div className="font-black text-sm text-[var(--foreground)] mt-0.5">
                            {item.total_price.toLocaleString()} KHR
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-xs text-[#8a9987] text-center">
                      Detailed item breakdown unavailable for this order.
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="p-5 bg-[#fafbf9] border-t border-[#dfe6d9] space-y-2">
                  <div className="flex justify-between text-xs text-[#667262]">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-[var(--foreground)]">
                      {selectedOrder.total_amount.toLocaleString()} KHR
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#667262]">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-[var(--leaf)]">Free Delivery</span>
                  </div>
                  <div className="pt-2 border-t border-[#e5e9df] flex justify-between text-sm">
                    <span className="font-extrabold text-[var(--foreground)]">Total Settlement</span>
                    <span className="font-black text-base text-[var(--leaf-dark)]">
                      {selectedOrder.total_amount.toLocaleString()} KHR
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline & Delivery Partner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Timeline */}
                <div className="rounded-2xl border border-[#dfe6d9] p-4 bg-white">
                  <h4 className="text-xs font-extrabold text-[#7d8b79] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--leaf)]" /> Order Milestones
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8a9987]">Created & Paid:</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8a9987]">Merchant Accepted:</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {selectedOrder.accepted_at
                          ? new Date(selectedOrder.accepted_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Awaiting acceptance"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8a9987]">Courier Arrived:</span>
                      <span className="font-semibold text-[var(--foreground)]">
                        {selectedOrder.arrived_at
                          ? new Date(selectedOrder.arrived_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : selectedOrder.status === "delivered" ? "Delivered" : "In transit"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Delivery Courier */}
                <div className="rounded-2xl border border-[#dfe6d9] p-4 bg-white">
                  <h4 className="text-xs font-extrabold text-[#7d8b79] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[var(--leaf)]" /> Assigned Courier
                  </h4>
                  {selectedOrder.delivery ? (
                    <div>
                      <div className="font-bold text-xs text-[var(--foreground)]">
                        {selectedOrder.delivery.name}
                      </div>
                      {selectedOrder.delivery.phone && (
                        <div className="text-xs text-[#556353] mt-1">
                          Phone: {selectedOrder.delivery.phone}
                        </div>
                      )}
                      {selectedOrder.delivery.email && (
                        <div className="text-xs text-[#7d8b79] mt-0.5">
                          {selectedOrder.delivery.email}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-[#8a9987] py-2">
                      Local courier dispatch pool · Standard certified driver
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-4 border-t border-[#dfe6d9] bg-[#fbf8f2] flex items-center justify-between">
              <span className="text-xs text-[#7d8b79] font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8a9987]" />
                Audit view only · Order cannot be altered from this panel.
              </span>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#edf5e8] border border-[#dfe6d9] text-xs font-bold text-[var(--foreground)] shadow-2xs transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}