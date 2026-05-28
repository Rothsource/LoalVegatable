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
    <>
      <h2 className="text-3xl font-bold text-gray-900">Orders</h2>

      <p className="mt-2 text-gray-600">Manage customer orders here.</p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-xl font-bold text-gray-900">Order List</h3>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900"
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
              <tr className="border-b text-sm text-gray-600">
                <th className="w-[16%] py-3 font-medium">Order ID</th>
                <th className="w-[18%] py-3 font-medium">Customer</th>
                <th className="w-[22%] py-3 font-medium">Product</th>
                <th className="w-[10%] py-3 font-medium">Total</th>
                <th className="w-[14%] py-3 font-medium">Status</th>
                <th className="w-[20%] py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-b-0">
                  <td className="truncate py-4 font-medium text-gray-900">
                    #{order.id}
                  </td>

                  <td className="truncate py-4 text-gray-700">
                    {order.customer}
                  </td>

                  <td className="truncate py-4 text-gray-700">
                    {order.product}
                  </td>

                  <td className="py-4 text-gray-700">${order.total}</td>

                  <td className="py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        order.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateStatus(order.id, "Completed")}
                        className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600"
                      >
                        Complete
                      </button>

                      <button
                        onClick={() => updateStatus(order.id, "Cancelled")}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
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
          <p className="mt-6 text-center text-gray-500">No orders found.</p>
        )}
      </div>
    </>
  );
}