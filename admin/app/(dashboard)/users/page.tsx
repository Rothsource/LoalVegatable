"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  status: "Active" | "Blocked";
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Users");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);

    const res = await fetch("/api/users");
    const data = await res.json();

    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function toggleStatus(user: User) {
    setActionLoading(true);

    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, block: user.status === "Active" }),
    });

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? { ...u, status: u.status === "Active" ? "Blocked" : "Active" }
          : u
      )
    );

    setActionLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setActionLoading(true);

    await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    setUsers((prev) => prev.filter((u) => u.id !== id));
    setActionLoading(false);
  }

  const filtered = users.filter((u) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      u.name?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword);

    const matchesFilter = filter === "All Users" ? true : u.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-gray-900">Users</h2>
        <p className="text-gray-600">Manage platform users and their access.</p>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">User List</h3>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-44"
            >
              <option>All Users</option>
              <option>Active</option>
              <option>Blocked</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-500">Loading...</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="border-b border-gray-300 text-sm font-semibold text-gray-600">
                  <th className="w-[23%] px-4 py-3">Name</th>
                  <th className="w-[32%] px-4 py-3">Email</th>
                  <th className="w-[13%] px-4 py-3">Status</th>
                  <th className="w-[16%] px-4 py-3">Registered</th>
                  <th className="w-[16%] px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 align-middle">
                      <p className="truncate font-medium text-gray-900">
                        {u.name || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <p className="truncate text-gray-600">
                        {u.email || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                          u.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <p className="truncate text-gray-600">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle text-right">
                      <div className="flex w-full justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(u)}
                          disabled={actionLoading}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                            u.status === "Active"
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          {u.status === "Active" ? "Block" : "Activate"}
                        </button>

                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
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

        {!loading && filtered.length === 0 && (
          <p className="mt-6 rounded-lg bg-gray-50 py-8 text-center text-gray-500">
            No users found.
          </p>
        )}
      </div>
    </>
  );
}