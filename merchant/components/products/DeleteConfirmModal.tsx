import { Product } from "@/types/product";
import { Icons } from "./ProductIcons";

type Props = {
  product: Product;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({ product, onCancel, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400">
          <Icons.AlertTriangle />
        </div>
        <h2 className="text-lg font-black text-gray-900 text-center">Delete product?</h2>
        <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
          You're about to permanently delete{" "}
          <strong className="text-gray-800">"{product.name}"</strong>.<br />
          This action cannot be undone.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition text-sm"
          >
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
}