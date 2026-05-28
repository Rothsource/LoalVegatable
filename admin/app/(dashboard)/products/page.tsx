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
      body: JSON.stringify({
        id: product.id,
        is_active: !product.is_active,
      }),
    });

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      )
    );

    setActionLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;

    setActionLoading(true);

    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    setProducts((prev) => prev.filter((p) => p.id !== id));
    setActionLoading(false);
  }

  const filtered = products.filter((p) => {
    const matchesSearch = p.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

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
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-xl font-bold text-gray-900">Product List</h3>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900"
            >
              <option>All Products</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="border-b text-sm text-gray-600">
                  <th className="w-[30%] py-3 font-medium">Product</th>
                  <th className="w-[15%] py-3 font-medium">Price</th>
                  <th className="w-[12%] py-3 font-medium">Stock</th>
                  <th className="w-[10%] py-3 font-medium">Organic</th>
                  <th className="w-[13%] py-3 font-medium">Status</th>
                  <th className="w-[20%] py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b transition hover:bg-gray-50"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {p.image_urls?.[0] && (
                          <img
                            src={p.image_urls[0]}
                            alt={p.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        )}

                        <span className="truncate font-medium text-gray-900">
                          {p.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 text-sm text-gray-700">
                      ${Number(p.price).toFixed(2)}
                      <span className="ml-1 text-gray-400">/ {p.unit}</span>
                    </td>

                    <td className="py-4 text-sm text-gray-700">
                      {p.stock_quantity}
                      <span className="ml-1 text-gray-400">{p.unit}</span>
                    </td>

                    <td className="py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          p.is_organic
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.is_organic ? "Yes" : "No"}
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelected(p)}
                          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                        >
                          View
                        </button>

                        <button
                          onClick={() => toggleActive(p)}
                          disabled={actionLoading}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
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
                          className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
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
    </>
  );
}