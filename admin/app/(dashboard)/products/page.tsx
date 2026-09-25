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

    if (selected?.id === product.id) {
      setSelected((prev) =>
        prev ? { ...prev, is_active: !prev.is_active } : null
      );
    }

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

  function formatMoney(value: number) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  const filtered = products.filter((p) => {
    const keyword = search.toLowerCase();

    const matchesSearch = p.name?.toLowerCase().includes(keyword);

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
      <div className="w-full max-w-full overflow-hidden">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600">
            Manage platform products and product information.
          </p>
        </div>

        <div className="mt-8 w-full rounded-2xl bg-white p-6 shadow">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="text-xl font-bold text-gray-900">Product List</h3>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-44"
              >
                <option>All Products</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">Loading...</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden w-full xl:block">
                <table className="w-full table-fixed text-left">
                  <thead>
                    <tr className="border-b border-gray-300 text-sm font-semibold text-gray-600">
                      <th className="w-[24%] px-4 py-3">Product</th>
                      <th className="w-[15%] px-4 py-3">Price</th>
                      <th className="w-[13%] px-4 py-3">Stock</th>
                      <th className="w-[12%] px-4 py-3">Organic</th>
                      <th className="w-[12%] px-4 py-3">Status</th>
                      <th className="w-[24%] px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 align-middle">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {p.name || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <p className="truncate text-sm text-gray-600">
                            {formatMoney(p.price)}{" "}
                            <span className="text-gray-400">/ {p.unit}</span>
                          </p>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <p className="truncate text-sm text-gray-600">
                            {p.stock_quantity}{" "}
                            <span className="text-gray-400">{p.unit}</span>
                          </p>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              p.is_organic
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {p.is_organic ? "Organic" : "No"}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              p.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {p.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-middle text-right">
                          <div className="flex w-full justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={() => setSelected(p)}
                              className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                            >
                              View
                            </button>

                            <button
                              onClick={() => toggleActive(p)}
                              disabled={actionLoading}
                              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
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

              {/* Tablet / Small Screen Cards */}
              <div className="grid gap-4 xl:hidden">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="truncate text-base font-bold text-gray-900">
                          {p.name || "—"}
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          {formatMoney(p.price)} / {p.unit}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                          p.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Stock</p>
                        <p className="mt-1 font-semibold text-gray-700">
                          {p.stock_quantity} {p.unit}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Organic</p>
                        <p className="mt-1 font-semibold text-gray-700">
                          {p.is_organic ? "Organic" : "No"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => setSelected(p)}
                        className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
                      >
                        View
                      </button>

                      <button
                        onClick={() => toggleActive(p)}
                        disabled={actionLoading}
                        className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
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
                        className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && filtered.length === 0 && (
            <p className="mt-6 rounded-lg bg-gray-50 py-8 text-center text-gray-500">
              No products found.
            </p>
          )}
        </div>
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
              <div className="flex min-w-0 items-center gap-3">
                {selected.image_urls?.[0] ? (
                  <img
                    src={selected.image_urls[0]}
                    alt={selected.name}
                    className="h-10 w-10 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-100" />
                )}

                <div className="min-w-0">
                  <p className="truncate text-base font-bold leading-tight text-gray-900">
                    {selected.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {selected.slug || "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="ml-4 text-2xl font-bold leading-none text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-4">
              <div className="flex flex-wrap gap-2">
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

              {selected.image_urls?.filter(Boolean).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Product Images
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

              {selected.background_pic_urls?.filter(Boolean).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Background Images
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {selected.background_pic_urls
                      .filter(Boolean)
                      .map((url, i) => (
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

              {selected.description && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Description
                  </p>

                  <p className="text-sm leading-relaxed text-gray-700">
                    {selected.description}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Pricing
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                    <p className="mb-1 text-xs text-gray-400">Price</p>
                    <p className="text-base font-bold text-gray-900">
                      {formatMoney(selected.price)}
                    </p>
                    <p className="text-xs text-gray-400">per {selected.unit}</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                    <p className="mb-1 text-xs text-gray-400">Compare</p>
                    <p
                      className={`text-base font-bold ${
                        selected.compare_price
                          ? "text-gray-400 line-through"
                          : "text-gray-300"
                      }`}
                    >
                      {selected.compare_price
                        ? formatMoney(selected.compare_price)
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-400">per {selected.unit}</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
                    <p className="mb-1 text-xs text-gray-400">Stock</p>
                    <p className="text-base font-bold text-gray-900">
                      {selected.stock_quantity}
                    </p>
                    <p className="text-xs text-gray-400">{selected.unit}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Details
                </p>

                <div className="space-y-2 text-sm">
                  {[
                    {
                      label: "Harvest date",
                      value: selected.harvest_date
                        ? new Date(selected.harvest_date).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "—",
                    },
                    {
                      label: "Expiry date",
                      value: selected.expire_date
                        ? new Date(selected.expire_date).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "—",
                    },
                    {
                      label: "Created",
                      value: selected.created_at
                        ? new Date(selected.created_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "—",
                    },
                    {
                      label: "Last updated",
                      value: selected.updated_at
                        ? new Date(selected.updated_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "—",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 border-b pb-2"
                    >
                      <span className="text-gray-500">{label}</span>
                      <span className="text-right font-medium text-gray-800">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pb-1">
                <button
                  onClick={() => toggleActive(selected)}
                  disabled={actionLoading}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
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
                  className="flex-1 rounded-xl bg-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-300 disabled:opacity-50"
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