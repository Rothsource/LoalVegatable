"use client";

import { useEffect, useState } from "react";
import { FormErrors, FormState, Unit } from "@/types/product";
import {
  inputErr,
  inputOk,
  labelCls,
  sectionHead,
} from "@/lib/productHelpers";
import { supabase } from "@/lib/supabase";

import { ImageUploadBox } from "./ImageUploadBox";
import { Icons } from "./ProductIcons";

type Props = {
  isEditing: boolean;
  form: FormState;
  formErrors: FormErrors;
  onClose: () => void;
  onSave: () => void;
  setField: <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => void;
  setBgPic: (index: number, url: string) => void;
};

export function ProductModal({
  isEditing,
  form,
  formErrors,
  onClose,
  onSave,
  setField,
  setBgPic,
}: Props) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (!error && data) setCategories(data);
    }
    loadCategories();
  }, []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white w-full sm:max-w-lg max-h-[94vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900">
              {isEditing ? "Edit product" : "Add new product"}
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              All fields marked * are required
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-gray-600"
          >
            <Icons.X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Basic Info */}
          <section className="space-y-4">
            <p className={sectionHead}>Basic Info</p>

            {/* Product Name */}
            <div>
              <label className={labelCls}>Product name *</label>

              <input
                type="text"
                placeholder="e.g. Tomatoes"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={formErrors.name ? inputErr : inputOk}
              />

              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className={labelCls}>Quantity *</label>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 50"
                  value={form.quantity}
                  onChange={(e) => setField("quantity", e.target.value)}
                  className={`flex-1 ${
                    formErrors.quantity ? inputErr : inputOk
                  }`}
                />

                <select
                  value={form.unit}
                  onChange={(e) =>
                    setField("unit", e.target.value as Unit)
                  }
                  className="w-24 flex-shrink-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition cursor-pointer"
                >
                  <option value="units">units</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>

              {formErrors.quantity && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  {formErrors.quantity}
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className={labelCls}>Price (KHR) *</label>

              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 4,000"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                className={formErrors.price ? inputErr : inputOk}
              />

              {formErrors.price && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  {formErrors.price}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={3}
                placeholder="Describe your product — freshness, origin, how it's grown..."
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className={`${inputOk} resize-none`}
              />
            </div>

            {/* Category — NEW */}
            <div>
              <label className={labelCls}>Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setField("categoryId", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition cursor-pointer"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Dates */}
          <section className="space-y-4">
            <p className={sectionHead}>Dates</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Harvest Date */}
              <div>
                <label className={labelCls}>Harvest date</label>

                <input
                  type="date"
                  value={form.harvestDate}
                  onChange={(e) =>
                    setField("harvestDate", e.target.value)
                  }
                  className={inputOk}
                />
              </div>

              {/* Expire Date */}
              <div>
                <label className={labelCls}>Expire date</label>

                <input
                  type="date"
                  value={form.expireDate}
                  onChange={(e) =>
                    setField("expireDate", e.target.value)
                  }
                  className={
                    formErrors.expireDate ? inputErr : inputOk
                  }
                />

                {formErrors.expireDate && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    {formErrors.expireDate}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Profile Picture */}
          <section className="space-y-4">
            <p className={sectionHead}>Profile Picture</p>

            <ImageUploadBox
              label="Main product photo"
              preview={form.profilePicUrl}
              onFile={(url) => setField("profilePicUrl", url)}
              onClear={() => setField("profilePicUrl", "")}
            />
          </section>

          {/* Background Pictures */}
          <section className="space-y-4">
            <div>
              <p className={sectionHead}>Background Pictures</p>

              <p className="text-xs text-gray-400 mt-1">
                Upload up to 3 photos for your product banner
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((index) => (
                <ImageUploadBox
                  key={index}
                  label={`Photo ${index + 1}`}
                  preview={form.backgroundPicUrls[index]}
                  onFile={(url) => setBgPic(index, url)}
                  onClear={() => setBgPic(index, "")}
                  small
                />
              ))}
            </div>
          </section>

          {/* Active Toggle */}
          <section>
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Visible to customers
                </p>

                <p className="text-xs text-gray-400 mt-0.5">
                  Toggle to show or hide this product
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setField("active", !form.active)
                }
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  form.active ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                    form.active ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-sm"
          >
            {isEditing ? "Save changes" : "Add product"}
          </button>
        </div>
      </div>
    </div>
  );
}
