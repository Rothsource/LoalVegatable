"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price: number;
  stock_quantity: number;
  unit: string;
  category_id: string;
  is_organic: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_urls: string[];
  merchant_id: string;
  profile_pic_url: string;
  background_pic_urls: string[];
  harvest_date: string;
  expire_date: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Products");
  const [selected, setSelected] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function toggleActive(product: Product) {
    setActionLoading(true);
    await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, is_active: !product.is_active }),
    });
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      )
    );
    if (selected?.id === product.id)
      setSelected((prev) =>
        prev ? { ...prev, is_active: !prev.is_active } : null
      );
    setActionLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setActionLoading(true);
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSelected(null);
    setActionLoading(false);
  }

  const filtered = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All Products"
        ? true
        : filter === "Active"
        ? p.is_active
        : !p.is_active;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900">Products</h2>
      <p className="mt-2 text-gray-600">
        Manage platform products and product information.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-bold text-gray-900">Product List</h3>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900 text-sm"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900 text-sm"
            >
              <option>All Products</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className="py-8 text-center text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b text-gray-600 text-sm">
                  <th className="py-3 font-medium">Product</th>
                  <th className="py-3 font-medium">Price</th>
                  <th className="py-3 font-medium">Stock</th>
                  <th className="py-3 font-medium">Organic</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {p.image_urls?.[0] ? (
                          <img
                            src={p.image_urls[0]}
                            alt={p.name}
                            className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                            No img
                          </div>
                        )}
                        <span className="font-medium text-gray-900 text-sm">
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-600 text-sm">
                      ${Number(p.price).toFixed(2)}{" "}
                      <span className="text-gray-400">/ {p.unit}</span>
                    </td>
                    <td className="py-4 text-gray-600 text-sm">
                      {p.stock_quantity}{" "}
                      <span className="text-gray-400">{p.unit}</span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          p.is_organic
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.is_organic ? "Organic" : "No"}
                      </span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          p.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelected(p)}
                          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => toggleActive(p)}
                          disabled={actionLoading}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 transition ${
                            p.is_active
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          {p.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition"
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
          <p className="mt-6 text-center text-gray-500">No products found.</p>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">

            {/* Modal header — sticky */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                {selected.image_urls?.[0] ? (
                  <img
                    src={selected.image_urls[0]}
                    alt=""
                    className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                    No img
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 text-base leading-tight">
                    {selected.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{selected.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none ml-4"
              >
                ×
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="overflow-y-auto px-5 py-4 space-y-5">

              {/* Status badges */}
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selected.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selected.is_active ? "Active" : "Inactive"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selected.is_organic
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {selected.is_organic ? "Organic" : "Non-organic"}
                </span>
              </div>

              {/* Product images */}
              {selected.image_urls?.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Product images
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {selected.image_urls.filter(Boolean).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Background images */}
              {selected.background_pic_urls?.filter(Boolean).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Background images
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.background_pic_urls.filter(Boolean).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="aspect-video w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              )}

              {/* Pricing */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Pricing
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Price</p>
                    <p className="text-base font-bold text-gray-900">
                      ${Number(selected.price).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">per {selected.unit}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Compare</p>
                    <p
                      className={`text-base font-bold ${
                        selected.compare_price
                          ? "text-gray-400 line-through"
                          : "text-gray-300"
                      }`}
                    >
                      {selected.compare_price
                        ? `$${Number(selected.compare_price).toFixed(2)}`
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-400">per {selected.unit}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Stock</p>
                    <p className="text-base font-bold text-gray-900">
                      {selected.stock_quantity}
                    </p>
                    <p className="text-xs text-gray-400">{selected.unit}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Details
                </p>
                <div className="space-y-2 text-sm">
                  {[
                    {
                      label: "Harvest date",
                      value: selected.harvest_date
                        ? new Date(selected.harvest_date).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "long", year: "numeric" }
                          )
                        : "—",
                    },
                    {
                      label: "Expiry date",
                      value: selected.expire_date
                        ? new Date(selected.expire_date).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "long", year: "numeric" }
                          )
                        : "—",
                    },
                    {
                      label: "Created",
                      value: new Date(selected.created_at).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "long", year: "numeric" }
                      ),
                    },
                    {
                      label: "Last updated",
                      value: new Date(selected.updated_at).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "long", year: "numeric" }
                      ),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between border-b pb-2"
                    >
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pb-1">
                <button
                  onClick={() => toggleActive(selected)}
                  disabled={actionLoading}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition ${
                    selected.is_active
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {actionLoading
                    ? "Processing..."
                    : selected.is_active
                    ? "Deactivate"
                    : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(selected.id)}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}