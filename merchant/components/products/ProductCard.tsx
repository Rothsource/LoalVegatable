import { Product } from "@/types/product";
import { stockStatus, isExpired, isExpiringSoon, fmtDate } from "@/lib/productHelpers";
import { Icons } from "./ProductIcons";

type Props = {
  product: Product;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onToggleActive: (p: Product) => void;
};

export function ProductCard({
  product: p,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  const { label, cls } = stockStatus(p.quantity);
  const expired = isExpired(p.expireDate);
  const soonExpire = isExpiringSoon(p.expireDate);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all group
        ${!p.active ? "opacity-60" : ""}
        ${isSelected ? "border-green-400 ring-2 ring-green-100" : "border-gray-100"}`}
    >
      {/* Image area */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {p.profilePicUrl ? (
          <img
            src={p.profilePicUrl}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Icons.Image />
          </div>
        )}

        {/* Checkbox */}
        <button
          onClick={() => onSelect(p.id)}
          className={`absolute top-2 left-2 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition backdrop-blur-sm
            ${isSelected ? "bg-green-600 border-green-600 text-white" : "bg-white/80 border-white hover:border-green-400"}`}
        >
          {isSelected && <Icons.Check size={10} />}
        </button>

        {/* Stock badge */}
        <span className={`absolute top-2 left-10 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${cls}`}>
          {label}
        </span>

        {/* Active toggle */}
        <button
          onClick={() => onToggleActive(p)}
          className={`absolute top-2 right-2 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm transition
            ${p.active ? "bg-green-600 text-white" : "bg-white/90 text-gray-600 border border-gray-200"}`}
        >
          {p.active ? <><Icons.Eye /> Active</> : <><Icons.EyeOff /> Hidden</>}
        </button>

        {/* Background pics strip */}
        {p.backgroundPicUrls.some((u) => u) && (
          <div className="absolute bottom-0 left-0 right-0 flex h-10 gap-px">
            {p.backgroundPicUrls.filter((u) => u).map((u, i) => (
              <img key={i} src={u} alt="" className="flex-1 h-full object-cover opacity-80" />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-snug">{p.name}</h3>
          {p.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {p.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 font-medium">Quantity</span>
          <span
            className={`font-bold ${
              p.quantity === 0 ? "text-red-500" : p.quantity <= 10 ? "text-amber-500" : "text-gray-800"
            }`}
          >
            {p.quantity} {p.unit ?? "units"}
          </span>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Icons.Calendar /> Harvest
            </span>
            <span className="text-gray-700 font-semibold">{fmtDate(p.harvestDate)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Icons.Calendar /> Expires
            </span>
            <span
              className={`font-semibold ${
                expired ? "text-red-500" : soonExpire ? "text-amber-500" : "text-gray-700"
              }`}
            >
              {fmtDate(p.expireDate)}
              {expired && " · Expired"}
              {soonExpire && !expired && " · Soon!"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onEdit(p)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-gray-600 hover:text-green-700 border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-xl py-2 transition font-semibold"
          >
            <Icons.Pencil /> Edit
          </button>
          <button
            onClick={() => onDelete(p)}
            className="flex items-center justify-center px-3 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 hover:bg-red-50 rounded-xl py-2 transition"
          >
            <Icons.Trash />
          </button>
        </div>
      </div>
    </div>
  );
}