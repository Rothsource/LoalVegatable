"use client";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";

import { Product, FormState, EMPTY_FORM } from "@/types/product";
import { validateForm } from "@/lib/productHelpers";

import { useToast, ToastContainer } from "@/components/products/ProductToast";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductModal } from "@/components/products/ProductModal";
import { DeleteConfirmModal } from "@/components/products/DeleteConfirmModal";
import { BulkConfirmModal } from "@/components/products/BulkConfirmModal";
import { PermanentDeleteProductModal } from "@/components/products/PermanentDeleteProductModal";
import { Icons } from "@/components/products/ProductIcons";

export default function ProductsPage() {
  const { toasts, toast, remove } = useToast();

  const [products, setProducts]         = useState<Product[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "archived">("active");
  const [showModal, setShowModal]       = useState(false);
  const [editProduct, setEditProduct]   = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Product | null>(null);
  const [bulkConfirm, setBulkConfirm]   = useState<"archive" | null>(null);
  const [form, setForm]                 = useState<FormState>({ ...EMPTY_FORM });
  const [formErrors, setFormErrors]     = useState<Partial<Record<keyof FormState, string>>>({});
  const [selected, setSelected]         = useState<Set<string>>(new Set());

  useEffect(() => {
    void fetchProducts();
    // The initial catalog load intentionally runs once for the signed-in merchant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false });

    if (error) { toast(error.message, "error"); setLoading(false); return; }

    setProducts((data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.stock_quantity,
      unit: p.unit,
      description: p.description ?? "",
      harvestDate: p.harvest_date ?? "",
      expireDate: p.expire_date ?? "",
      profilePicUrl: p.profile_pic_url ?? "",
      backgroundPicUrls: p.background_pic_urls ?? ["", "", ""],
      active: p.is_active,
      price: p.price,
      categoryId: p.category_id ?? "",   // ← add
    })));
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return products.filter(
      (product) =>
        product.active === (statusFilter === "active") &&
        (product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query))
    );
  }, [products, search, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  }
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkArchive() {
    const count = selected.size;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .in("id", ids);
    if (error) { toast(error.message, "error"); return; }
    setProducts((prev) =>
      prev.map((product) =>
        selected.has(product.id) ? { ...product, active: false } : product
      )
    );
    setSelected(new Set());
    setBulkConfirm(null);
    toast(`Archived ${count} product${count > 1 ? "s" : ""}`, "warning");
  }

  function openAdd() {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM, backgroundPicUrls: ["", "", ""] });
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({
      name: p.name,
      quantity: String(p.quantity),
      unit: p.unit,
      description: p.description,
      harvestDate: p.harvestDate,
      expireDate: p.expireDate,
      profilePicUrl: p.profilePicUrl,
      backgroundPicUrls: [...p.backgroundPicUrls],
      active: p.active,
      price: String(p.price),
      categoryId: p.categoryId,        // ← add
    });
    setFormErrors({});
    setShowModal(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (formErrors[key])
      setFormErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function setBgPic(i: number, url: string) {
    const updated = [...form.backgroundPicUrls];
    updated[i] = url;
    setForm((f) => ({ ...f, backgroundPicUrls: updated }));
  }

  async function handleSave() {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("Please fix the errors before saving", "error");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      name: form.name.trim(),
      stock_quantity: Number(form.quantity),
      unit: form.unit,
      description: form.description.trim(),
      harvest_date: form.harvestDate || null,
      expire_date: form.expireDate || null,
      profile_pic_url: form.profilePicUrl,
      background_pic_urls: form.backgroundPicUrls,
      is_active: form.active,
      price: Number(form.price),
      merchant_id: user.id,
      category_id: form.categoryId || null,   // ← add this line
      slug: form.name.trim().toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
    };

    if (editProduct) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editProduct.id);
      if (error) { toast(error.message, "error"); return; }
      toast(`"${payload.name}" updated successfully`);
    } else {
      const { error } = await supabase
        .from("products")
        .insert(payload);
      if (error) { toast(error.message, "error"); return; }
      toast(`"${payload.name}" added successfully`);
    }

    await fetchProducts();
    setShowModal(false);
  }

  async function handleArchive() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", deleteTarget.id);
    if (error) { toast(error.message, "error"); return; }
    setProducts((prev) =>
      prev.map((product) =>
        product.id === deleteTarget.id ? { ...product, active: false } : product
      )
    );
    setSelected((prev) => { const n = new Set(prev); n.delete(deleteTarget.id); return n; });
    toast(`"${deleteTarget.name}" archived`, "warning");
    setDeleteTarget(null);
  }

  async function restoreProduct(p: Product) {
    const { error } = await supabase
      .from("products")
      .update({ is_active: true })
      .eq("id", p.id);
    if (error) { toast(error.message, "error"); return; }
    setProducts((prev) =>
      prev.map((item) => item.id === p.id ? { ...item, active: true } : item)
    );
    toast(`"${p.name}" restored`);
  }

  async function permanentlyDeleteProduct() {
    if (!permanentDeleteTarget || permanentDeleteTarget.active) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", permanentDeleteTarget.id);

    if (error) {
      toast(error.message, "error");
      return;
    }

    setProducts((prev) =>
      prev.filter((product) => product.id !== permanentDeleteTarget.id)
    );
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(permanentDeleteTarget.id);
      return next;
    });
    toast(`"${permanentDeleteTarget.name}" permanently deleted`, "error");
    setPermanentDeleteTarget(null);
  }

  const stats = [
    { label: "Total",        value: products.length,                                color: "text-gray-900"  },
    { label: "Active",       value: products.filter((p) => p.active).length,        color: "text-green-600" },
    { label: "Archived",     value: products.filter((p) => !p.active).length,       color: "text-gray-500"  },
    { label: "Low / Out",    value: products.filter((p) => p.active && p.quantity <= 10).length, color: "text-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f9f3] text-gray-900"
      style={{ fontFamily: "'DM Sans','Helvetica Neue',Arial,sans-serif" }}>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-24">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-gray-900">Products</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {products.length} total · {products.filter((p) => p.active).length} active
            </p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm">
            <Icons.Plus /> Add product
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-gray-200 bg-white p-1">
            {(["active", "archived"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setStatusFilter(filter);
                  setSelected(new Set());
                }}
                className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition ${
                  statusFilter === filter
                    ? "bg-green-600 text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Icons.Search />
            </span>
            <input type="text"
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-900 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition placeholder:text-gray-400"
              placeholder={`Search ${statusFilter} products...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                <Icons.X size={14} />
              </button>
            )}
          </div>
        </div>

        {selected.size > 0 && statusFilter === "active" && (
          <div className="bg-gray-900 text-white rounded-2xl px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm font-bold">
              {selected.size} product{selected.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <button onClick={() => setBulkConfirm("archive")}
                className="flex items-center gap-2 text-xs font-bold bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl transition">
                <Icons.EyeOff /> Archive
              </button>
              <button onClick={() => setSelected(new Set())}
                className="text-gray-400 hover:text-white p-2 transition">
                <Icons.X size={14} />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-28 text-gray-400">
            <p className="text-sm font-semibold">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-gray-300">
            <Icons.Package />
            <p className="font-bold text-gray-500 text-lg mt-5">
              No {statusFilter} products found
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter === "active"
                ? "Try a different search or add a new product"
                : "Products you archive will stay here until you restore them"}
            </p>
            {statusFilter === "active" && (
              <button onClick={openAdd}
                className="mt-6 flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition">
                <Icons.Plus /> Add product
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-1">
              <button onClick={toggleSelectAll}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition flex-shrink-0
                  ${allSelected ? "bg-green-600 border-green-600 text-white" : "border-gray-300 hover:border-green-400"}`}>
                {allSelected && <Icons.Check size={10} />}
              </button>
              <span className="text-xs text-gray-400 font-medium">
                {allSelected ? "Deselect all" : `Select all ${filtered.length}`}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isSelected={selected.has(p.id)}
                  onSelect={toggleSelect}
                  onEdit={openEdit}
                  onArchive={setDeleteTarget}
                  onRestore={restoreProduct}
                  onPermanentDelete={setPermanentDeleteTarget}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {showModal && (
        <ProductModal
          isEditing={!!editProduct}
          form={form}
          formErrors={formErrors}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          setField={setField}
          setBgPic={setBgPic}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleArchive}
        />
      )}
      {bulkConfirm && (
        <BulkConfirmModal
          count={selected.size}
          onCancel={() => setBulkConfirm(null)}
          onConfirm={bulkArchive}
        />
      )}
      {permanentDeleteTarget && !permanentDeleteTarget.active && (
        <PermanentDeleteProductModal
          product={permanentDeleteTarget}
          onCancel={() => setPermanentDeleteTarget(null)}
          onConfirm={permanentlyDeleteProduct}
        />
      )}
    </div>
  );
}
