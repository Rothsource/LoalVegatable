"use client";

import { useState } from "react";

type Order = {
  id: number;
  customer: string;
  product: string;
  total: number;
  status: "Pending" | "Completed" | "Cancelled";
};

const initialOrders: Order[] = [
  {
    id: 1001,
    customer: "Sok Dara",
    product: "Fresh Apple",
    total: 25,
    status: "Pending",
  },
  {
    id: 1002,
    customer: "Chan Lina",
    product: "Organic Tomato",
    total: 40,
    status: "Completed",
  },
  {
    id: 1003,
    customer: "Meng Hong",
    product: "Carrot",
    total: 15,
    status: "Cancelled",
  },
  {
    id: 1004,
    customer: "Sophea Kim",
    product: "Morning Glory & Spinach",
    total: 18.5,
    status: "Pending",
  },
  {
    id: 1005,
    customer: "Vannak Meas",
    product: "Khmer Crispy Cucumbers",
    total: 32,
    status: "Completed",
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Orders");

  function updateStatus(
    id: number,
    status: "Pending" | "Completed" | "Cancelled"
  ) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === id ? { ...order, status } : order
      )
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      String(order.id).includes(search) ||
      order.customer.toLowerCase().includes(search.toLowerCase()) ||
      order.product.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All Orders" || order.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-[var(--foreground)] font-heading">Customer Orders</h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#667262]">Manage and reconcile agricultural marketplace transactions.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 border border-[#dfe6d9] shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">Order Roster</h3>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by ID, customer, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-2 text-sm text-[var(--foreground)] placeholder-[#9ca69a] focus:bg-white focus:border-[var(--leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--leaf)]/20"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-2 text-sm text-[var(--foreground)] focus:bg-white focus:border-[var(--leaf)] focus:outline-none"
            >
              <option>All Orders</option>
              <option>Pending</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left">
            <thead>
              <tr className="border-b border-[#dfe6d9] text-xs font-bold text-[#667262] uppercase tracking-wider">
                <th className="w-[16%] py-3.5">Order ID</th>
                <th className="w-[18%] py-3.5">Customer</th>
                <th className="w-[22%] py-3.5">Produce Items</th>
                <th className="w-[10%] py-3.5">Total</th>
                <th className="w-[14%] py-3.5">Status</th>
                <th className="w-[20%] py-3.5">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#f2f4ef] text-sm">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#fafbf9] transition-colors">
                  <td className="truncate py-4 font-black text-[var(--foreground)]">
                    #{order.id}
                  </td>

                  <td className="truncate py-4 font-semibold text-[var(--foreground)]">
                    {order.customer}
                  </td>

                  <td className="truncate py-4 text-[#556353]">
                    {order.product}
                  </td>

                  <td className="py-4 font-bold text-[var(--foreground)]">${order.total.toFixed(2)}</td>

                  <td className="py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                        order.status === "Completed"
                          ? "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]"
                          : order.status === "Pending"
                          ? "bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateStatus(order.id, "Completed")}
                        className="rounded-xl bg-[var(--leaf)] hover:bg-[var(--leaf-dark)] px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        Complete
                      </button>

                      <button
                        onClick={() => updateStatus(order.id, "Cancelled")}
                        className="rounded-xl bg-[#fee2e2] hover:bg-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <p className="mt-8 text-center text-sm text-[#7d8b79] py-4">No matching orders found.</p>
        )}
      </div>
    </div>
  );
}