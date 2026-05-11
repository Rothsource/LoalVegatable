"use client";

import { useState } from "react";

type User = {
  name: string;
  email: string;
  status: "Active" | "Blocked";
};

const initialUsers: User[] = [
  {
    name: "Sok Dara",
    email: "sokdara@gmail.com",
    status: "Active",
  },
  {
    name: "Chan Lina",
    email: "chanlina@gmail.com",
    status: "Blocked",
  },
  {
    name: "Meng Hong",
    email: "menghong@gmail.com",
    status: "Active",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Users");

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newStatus, setNewStatus] = useState<"Active" | "Blocked">("Active");

  function addUser(e: React.FormEvent) {
    e.preventDefault();

    const newUser: User = {
      name: newName,
      email: newEmail,
      status: newStatus,
    };

    setUsers([...users, newUser]);
    setNewName("");
    setNewEmail("");
    setNewStatus("Active");
    setShowForm(false);
  }

  function toggleUserStatus(email: string) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.email === email
          ? {
              ...user,
              status: user.status === "Active" ? "Blocked" : "Active",
            }
          : user
      )
    );
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "All Users" || user.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900">Users</h2>

      <p className="mt-2 text-gray-600">
        Manage platform users and search user information.
      </p>

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

            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Add User
            </button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-3">Name</th>
              <th className="py-3">Email</th>
              <th className="py-3">Status</th>
              <th className="py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.email} className="border-b">
                <td className="py-4 font-medium text-gray-900">{user.name}</td>
                <td className="py-4 text-gray-600">{user.email}</td>

                <td className="py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      user.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>

                <td className="py-4">
                  <button
                    onClick={() => toggleUserStatus(user.email)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                      user.status === "Active"
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                  >
                    {user.status === "Active" ? "Block" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <p className="mt-6 text-center text-gray-500">No users found.</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <form
            onSubmit={addUser}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-900">Add User</h3>

            <input
              type="text"
              placeholder="User name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              required
            />

            <input
              type="email"
              placeholder="User email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              required
            />

            <select
              value={newStatus}
              onChange={(e) =>
                setNewStatus(e.target.value as "Active" | "Blocked")
              }
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
            >
              <option>Active</option>
              <option>Blocked</option>
            </select>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}