"use client";

import { useState } from "react";

const products = [
  {
    name: "Fresh Apple",
    category: "Fruits",
    stock: "Available",
  },
  {
    name: "Organic Tomato",
    category: "Vegetables",
    stock: "Out of Stock",
  },
  {
    name: "Carrot",
    category: "Vegetables",
    stock: "Available",
  },
];

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Products");

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All Products" || product.stock === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900">Products</h2>

      <p className="mt-2 text-gray-600">
        Manage platform products and product information.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-bold text-gray-900">Product List</h3>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            >
              <option>All Products</option>
              <option>Available</option>
              <option>Out of Stock</option>
            </select>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-3">Product</th>
              <th className="py-3">Category</th>
              <th className="py-3">Stock</th>
              <th className="py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.name} className="border-b">
                <td className="py-4 font-medium text-gray-900">
                  {product.name}
                </td>

                <td className="py-4 text-gray-600">{product.category}</td>

                <td className="py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      product.stock === "Available"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>

                <td className="py-4">
                  <button
                    onClick={() => alert(`Managing ${product.name}`)}
                    className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <p className="mt-6 text-center text-gray-500">
            No products found.
          </p>
        )}
      </div>
    </>
  );
}