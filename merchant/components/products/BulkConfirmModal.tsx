import { Icons } from "./ProductIcons";

type BulkAction = "delete" | "hide";

type Props = {
  action: BulkAction;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function BulkConfirmModal({ action, count, onCancel, onConfirm }: Props) {
  const isDelete = action === "delete";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4
            ${isDelete ? "bg-red-50 border border-red-100 text-red-400" : "bg-gray-100 text-gray-500"}`}
        >
          {isDelete ? <Icons.AlertTriangle /> : <Icons.EyeOff />}
        </div>
        <h2 className="text-lg font-black text-gray-900 text-center">
          {isDelete ? `Delete ${count} products?` : `Hide ${count} products?`}
        </h2>
        <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
          {isDelete
            ? "This will permanently remove all selected products and cannot be undone."
            : "Selected products will be hidden from customers. You can re-enable them anytime."}
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
            className={`flex-1 text-white font-bold py-3 rounded-xl transition text-sm
              ${isDelete ? "bg-red-500 hover:bg-red-600" : "bg-gray-800 hover:bg-gray-900"}`}
          >
            {isDelete ? "Yes, delete all" : "Yes, hide all"}
          </button>
        </div>
      </div>
    </div>
  );
}