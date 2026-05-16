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
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All Users" ? true : u.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900">Users</h2>
      <p className="mt-2 text-gray-600">Manage platform users and their access.</p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-bold text-gray-900">User List</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            >
              <option>All Users</option>
              <option>Active</option>
              <option>Blocked</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-gray-500">Loading...</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-3">Name</th>
                <th className="py-3">Email</th>
                <th className="py-3">Status</th>
                <th className="py-3">Registered</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="py-4 font-medium text-gray-900">{u.name}</td>
                  <td className="py-4 text-gray-600">{u.email}</td>
                  <td className="py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        u.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-600">
                    {new Date(u.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={actionLoading}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
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
                        className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <p className="mt-6 text-center text-gray-500">No users found.</p>
        )}
      </div>
    </>
  );
}