"use client";

import { useState } from "react";

type Merchant = {
  name: string;
  email: string;
  status: "Pending" | "Approved" | "Declined";
};

const initialMerchants: Merchant[] = [
  {
    name: "Green Farm",
    email: "greenfarm@gmail.com",
    status: "Pending",
  },
  {
    name: "Fresh Market",
    email: "freshmarket@gmail.com",
    status: "Approved",
  },
  {
    name: "Local Vegetable Shop",
    email: "localveg@gmail.com",
    status: "Declined",
  },
];

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>(initialMerchants);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Merchants");

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  function updateMerchantStatus(
    email: string,
    newStatus: "Approved" | "Declined"
  ) {
    setMerchants((currentMerchants) =>
      currentMerchants.map((merchant) =>
        merchant.email === email
          ? { ...merchant, status: newStatus }
          : merchant
      )
    );
  }

  function addMerchant(e: React.FormEvent) {
    e.preventDefault();

    const newMerchant: Merchant = {
      name: newName,
      email: newEmail,
      status: "Pending",
    };

    setMerchants([...merchants, newMerchant]);
    setNewName("");
    setNewEmail("");
    setShowForm(false);
  }

  const filteredMerchants = merchants.filter((merchant) => {
    const matchesSearch =
      merchant.name.toLowerCase().includes(search.toLowerCase()) ||
      merchant.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All Merchants" || merchant.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900">Merchants</h2>

      <p className="mt-2 text-gray-600">
        Manage merchant registrations and merchant information.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-bold text-gray-900">Merchant List</h3>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search merchants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            >
              <option>All Merchants</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Declined</option>
            </select>

            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Add Merchant
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
            {filteredMerchants.map((merchant) => (
              <tr key={merchant.email} className="border-b">
                <td className="py-4 font-medium text-gray-900">
                  {merchant.name}
                </td>

                <td className="py-4 text-gray-600">{merchant.email}</td>

                <td className="py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      merchant.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : merchant.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {merchant.status}
                  </span>
                </td>

                <td className="space-x-2 py-4">
                  {merchant.status === "Pending" ? (
                    <>
                      <button
                        onClick={() =>
                          updateMerchantStatus(merchant.email, "Approved")
                        }
                        className="rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          updateMerchantStatus(merchant.email, "Declined")
                        }
                        className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => alert(`Managing ${merchant.name}`)}
                      className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Manage
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMerchants.length === 0 && (
          <p className="mt-6 text-center text-gray-500">
            No merchants found.
          </p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <form
            onSubmit={addMerchant}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-900">Add Merchant</h3>

            <input
              type="text"
              placeholder="Merchant name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              required
            />

            <input
              type="email"
              placeholder="Merchant email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
              required
            />

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