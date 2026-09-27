"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Package, Search, Filter, Clock, CheckCircle2, AlertCircle, 
  MapPin, Phone, User, RefreshCw, ChevronRight, Truck, CreditCard,
  ArrowUpRight, ShoppingBag, Image as ImageIcon
} from "lucide-react";
import { PageHeading } from "@/components/ui/PageHeading";
import { supabase } from "@/lib/supabase";
import OrderItemsPictureModal, { OrderPreviewModalData } from "@/components/OrderItemsPictureModal";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string;
  product_name?: string;
  unit?: string;
  img?: string;
}

interface MerchantOrder {
  id: string;
  created_at: string;
  status: string;
  payment_status: string;
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  address_street?: string;
  address_province?: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<OrderPreviewModalData | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/merchant/orders?merchantId=${user.id}`);
      if (!res.ok) {
        throw new Error("Failed to load orders");
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error loading merchant orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("merchant-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", orderId);

      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        (o.address_street && o.address_street.toLowerCase().includes(search.toLowerCase())) ||
        (o.address_province && o.address_province.toLowerCase().includes(search.toLowerCase())) ||
        o.items.some(i => i.product_name?.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "pending" ? (o.status === "pending" || o.status === "accepted") :
        o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === "pending" || o.status === "accepted").length;
    const delivering = orders.filter(o => o.status === "out_for_delivery" || o.status === "delivering").length;
    const revenue = orders
      .filter(o => o.payment_status === "paid")
      .reduce((sum, o) => sum + o.total_amount, 0);

    return { total, pending, delivering, revenue };
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return { label: "Driver Accepted", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: <CheckCircle2 size={13} /> };
      case "out_for_delivery":
      case "delivering":
        return { label: "Out for Delivery", bg: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <Truck size={13} /> };
      case "delivered":
        return { label: "Delivered", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={13} /> };
      case "cancelled":
        return { label: "Cancelled", bg: "bg-rose-50 text-rose-700 border-rose-200", icon: <AlertCircle size={13} /> };
      default:
        return { label: "Pending", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock size={13} /> };
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6">
      {/* Top Header */}
      <PageHeading
        eyebrow="Order Fulfillment"
        title="Customer Orders"
        description="Realtime customer orders, dispatch status, and verified ABA payments."
        action={
          <button 
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#dfe6d9] text-sm font-bold text-[var(--foreground)] hover:bg-[#fafbf9] shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-[22px] p-5 border border-[#dfe6d9] card-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7d8b79]">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-[#edf6e9] text-[var(--leaf-dark)] flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--foreground)] font-heading">{stats.total}</div>
          <div className="mt-1 text-xs text-[#7d8b79]">All recorded orders</div>
        </div>

        <div className="bg-white rounded-[22px] p-5 border border-[#dfe6d9] card-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">Pending Action</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-heading">{stats.pending}</div>
          <div className="mt-1 text-xs text-amber-600 font-semibold">Requires preparation</div>
        </div>

        <div className="bg-white rounded-[22px] p-5 border border-[#dfe6d9] card-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">In Transit</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 font-heading">{stats.delivering}</div>
          <div className="mt-1 text-xs text-blue-600/80">With distributors</div>
        </div>

        <div className="bg-white rounded-[22px] p-5 border border-[#dfe6d9] card-shadow">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--leaf-dark)]">Paid Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-heading">{stats.revenue.toLocaleString()} <span className="text-xs font-bold text-gray-500">KHR</span></div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold">Confirmed payments</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[22px] p-4 border border-[#dfe6d9] card-shadow mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: "all", label: "All Orders" },
            { id: "pending", label: "Pending" },
            { id: "out_for_delivery", label: "In Delivery" },
            { id: "delivered", label: "Delivered" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[var(--leaf-dark)] text-white shadow-xs"
                  : "bg-[#fafbf9] text-[#556353] border border-[#dfe6d9] hover:bg-[#edf6e9]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID or item…"
            className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-green-600 outline-none transition"
          />
        </div>
      </div>

      {/* Orders List or Empty State */}
      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw size={24} className="animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <section className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white px-6 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 mb-4">
            <Package className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-lg font-black text-gray-900">
            {search || statusFilter !== "all" ? "No matching orders found" : "No orders yet"}
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray-500 leading-relaxed">
            {search || statusFilter !== "all"
              ? "Try adjusting your search query or switching filters to see other orders."
              : "When customers checkout your vegetables in the store, their delivery requests and orders will appear here automatically."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/product"
              className="rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-green-700 shadow-sm"
            >
              Manage Products
            </Link>
            <Link
              href="/home"
              className="rounded-xl bg-gray-100 px-5 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200"
            >
              Dashboard Overview
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const badge = getStatusBadge(order.status);
            const dateStr = new Date(order.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            });

            return (
              <div 
                key={order.id}
                className="bg-white rounded-[24px] border border-[#dfe6d9] p-5 sm:p-6 card-shadow card-lift"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dfe6d9] pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[var(--foreground)] text-sm font-heading">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-[#7d8b79] font-medium">{dateStr}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                      {badge.icon} {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                      order.payment_status === "paid" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {order.payment_status === "paid" ? "✓ Paid via ABA" : "Payment Pending"}
                    </span>
                    <span className="text-base font-black text-gray-900">
                      {order.total_amount.toLocaleString()} KHR
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Items List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Vegetables Ordered ({order.items.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewOrder({
                          orderId: order.id,
                          totalAmount: order.total_amount,
                          status: order.status,
                          address: { province: order.address_province, street: order.address_street, phone: order.customer_phone },
                          items: order.items.map(it => ({
                            id: it.id,
                            product_id: it.product_id,
                            product_name: it.product_name,
                            quantity: it.quantity,
                            unit: it.unit,
                            unit_price: it.unit_price,
                            total_price: it.total_price,
                            img: it.img,
                          })),
                        })}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 hover:underline cursor-pointer"
                      >
                        <ImageIcon size={12} />
                        <span>View Pictures</span>
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {order.items.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPreviewOrder({
                            orderId: order.id,
                            totalAmount: order.total_amount,
                            status: order.status,
                            address: { province: order.address_province, street: order.address_street, phone: order.customer_phone },
                            items: order.items.map(it => ({
                              id: it.id,
                              product_id: it.product_id,
                              product_name: it.product_name,
                              quantity: it.quantity,
                              unit: it.unit,
                              unit_price: it.unit_price,
                              total_price: it.total_price,
                              img: it.img,
                            })),
                          })}
                          className="w-full flex items-center justify-between text-xs bg-gray-50 hover:bg-green-50/60 rounded-xl px-3 py-2 border border-transparent hover:border-green-200 transition-all cursor-pointer text-left"
                          title="Click to view produce picture"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.img ? (
                              <img src={item.img} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                            ) : (
                              <Package size={14} className="text-green-600 flex-shrink-0" />
                            )}
                            <span className="font-bold text-gray-800 truncate">
                              {item.product_name} <span className="text-green-600 font-extrabold">×{item.quantity} {item.unit || "kg"}</span>
                            </span>
                          </div>
                          <span className="text-gray-500 font-semibold flex-shrink-0 ml-2">
                            {item.total_price.toLocaleString()} KHR
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Destination & Action */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                        Delivery Destination
                      </span>
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <MapPin size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900">
                            {order.address_province || "Phnom Penh"}
                          </p>
                          <p className="text-gray-500 mt-0.5">
                            {order.address_street || "Delivery address registered"}
                          </p>
                          {order.customer_phone && (
                            <p className="text-gray-700 font-semibold mt-1 flex items-center gap-1">
                              <Phone size={12} className="text-gray-400" /> {order.customer_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Changer Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 justify-end">
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "accepted")}
                          disabled={updatingId === order.id}
                          className="px-3.5 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition"
                        >
                          Confirm & Prepare
                        </button>
                      )}
                      {order.status === "accepted" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "out_for_delivery")}
                          disabled={updatingId === order.id}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
                        >
                          Handed to Rider
                        </button>
                      )}
                      {order.status === "out_for_delivery" && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "delivered")}
                          disabled={updatingId === order.id}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Produce Pictures Modal */}
      <OrderItemsPictureModal
        order={previewOrder}
        onClose={() => setPreviewOrder(null)}
      />
    </main>
  );
}
