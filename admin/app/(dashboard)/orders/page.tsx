"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id?: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  quantity?: number;
  price?: number;
  unit_price?: number;
  subtotal?: number;
};

type Order = {
  id: string;
  order_number?: string;
  customer_name?: string;
  customer_email?: string;
  user_name?: string;
  user_email?: string;
  full_name?: string;
  email?: string;
  status?: string;
  payment_status?: string;
  total_amount?: number;
  total?: number;
  subtotal?: number;
  delivery_fee?: number;
  address?: string;
  delivery_address?: string;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
};

const statusOptions = [
  "All Orders",
  "Pending",
  "Processing",
  "Completed",
  "Cancelled",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Orders");
  const [selected, setSelected] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders");

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load orders. Please check /api/orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(order: Order, status: string) {
    setActionLoading(true);

    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          status,
        }),
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status } : o))
      );

      if (selected?.id === order.id) {
        setSelected((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update order status.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this order?")) return;

    setActionLoading(true);

    try {
      await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete order.");
    } finally {
      setActionLoading(false);
    }
  }

  function getCustomerName(order: Order) {
    return (
      order.customer_name ||
      order.user_name ||
      order.full_name ||
      order.email ||
      "Unknown customer"
    );
  }

  function getCustomerEmail(order: Order) {
    return order.customer_email || order.user_email || order.email || "—";
  }

  function getOrderNumber(order: Order) {
    return order.order_number || `#${order.id.slice(0, 8)}`;
  }

  function getTotal(order: Order) {
    return Number(order.total_amount ?? order.total ?? order.subtotal ?? 0);
  }

  function formatDate(date?: string) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusClass(status?: string) {
    const normalized = status?.toLowerCase();

    if (normalized === "completed") {
      return "bg-green-100 text-green-700";
    }

    if (normalized === "processing") {
      return "bg-blue-100 text-blue-700";
    }

    if (normalized === "cancelled") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  const filtered = orders.filter((order) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      getOrderNumber(order).toLowerCase().includes(keyword) ||
      getCustomerName(order).toLowerCase().includes(keyword) ||
      getCustomerEmail(order).toLowerCase().includes(keyword) ||
      order.status?.toLowerCase().includes(keyword);

    const matchesFilter =
      filter === "All Orders"
        ? true
        : order.status?.toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
        <p className="text-gray-600">
          Manage customer orders, status, and order details.
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Order List</h3>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-44"
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-500">Loading...</p>
        ) : error ? (
          <div className="rounded-lg bg-red-50 px-4 py-6 text-center text-sm text-red-600">
            {error}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="border-b border-gray-300 text-sm font-semibold text-gray-600">
                  <th className="w-[17%] px-4 py-3">Order</th>
                  <th className="w-[24%] px-4 py-3">Customer</th>
                  <th className="w-[13%] px-4 py-3">Total</th>
                  <th className="w-[14%] px-4 py-3">Status</th>
                  <th className="w-[14%] px-4 py-3">Date</th>
                  <th className="w-[18%] px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 align-middle">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {getOrderNumber(order)}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {getCustomerName(order)}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {getCustomerEmail(order)}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <p className="truncate text-sm font-medium text-gray-700">
                        ${getTotal(order).toFixed(2)}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <p className="truncate text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle text-right">
                      <div className="flex w-full justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelected(order)}
                          className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                        >
                          View
                        </button>

                        <button
                          onClick={() => updateOrderStatus(order, "Completed")}
                          disabled={actionLoading}
                          className="rounded-lg bg-green-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
                        >
                          Complete
                        </button>

                        <button
                          onClick={() => handleDelete(order.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-300 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="mt-6 rounded-lg bg-gray-50 py-8 text-center text-gray-500">
            No orders found.
          </p>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {getOrderNumber(selected)}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(selected.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="text-2xl font-bold leading-none text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                    selected.status
                  )}`}
                >
                  {selected.status || "Pending"}
                </span>

                {selected.payment_status && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    Payment: {selected.payment_status}
                  </span>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Customer
                </p>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">
                    {getCustomerName(selected)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {getCustomerEmail(selected)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Delivery Address
                </p>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-700">
                    {selected.delivery_address || selected.address || "—"}
                  </p>
                </div>
              </div>

              {selected.items && selected.items.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Order Items
                  </p>

                  <div className="space-y-2">
                    {selected.items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.product_name || item.name || "Product"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity ?? 0}
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-gray-700">
                          $
                          {Number(
                            item.subtotal ??
                              (item.quantity ?? 0) *
                                Number(item.price ?? item.unit_price ?? 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Summary
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-800">
                      ${Number(selected.subtotal ?? getTotal(selected)).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Delivery fee</span>
                    <span className="font-medium text-gray-800">
                      ${Number(selected.delivery_fee ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">
                      ${getTotal(selected).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Update Status
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {["Pending", "Processing", "Completed", "Cancelled"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selected, status)}
                        disabled={actionLoading}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        {status}
                      </button>
                    )
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(selected.id)}
                disabled={actionLoading}
                className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}