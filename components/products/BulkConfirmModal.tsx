import { Icons } from "./ProductIcons";

type Props = {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function BulkConfirmModal({ count, onCancel, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-amber-50 border border-amber-100 text-amber-500"
        >
          <Icons.EyeOff />
        </div>
        <h2 className="text-lg font-black text-gray-900 text-center">
          Archive {count} products?
        </h2>
        <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
          Selected products will be hidden from customers and can be restored
          from the Archived filter.
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
            className="flex-1 text-white font-bold py-3 rounded-xl transition text-sm bg-amber-500 hover:bg-amber-600"
          >
            Archive all
          </button>
        </div>
      </div>
    </div>
  );
}
