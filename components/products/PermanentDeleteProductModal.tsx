import { Product } from "@/types/product";
import { Icons } from "./ProductIcons";

type Props = {
  product: Product;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PermanentDeleteProductModal({
  product,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500">
          <Icons.AlertTriangle />
        </div>
        <h2 className="text-center text-lg font-black text-gray-900">
          Delete permanently?
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
          <strong className="text-gray-800">{product.name}</strong> will be
          removed from the database. This action cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600"
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
