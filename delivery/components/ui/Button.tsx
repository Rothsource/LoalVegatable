import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  children,
  loading = false,
  variant = "primary",
  icon,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "border-[var(--leaf)] bg-[var(--leaf)] text-white hover:bg-[var(--leaf-dark)] hover:border-[var(--leaf-dark)] shadow-[0_10px_24px_rgba(46,111,64,0.18)]",
    secondary: "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[#b8c8b0] hover:bg-[#f8fbf5]",
    danger: "border-[#f2d0cc] bg-[#fff6f4] text-[var(--danger)] hover:bg-[#fce9e6]",
    ghost: "border-transparent bg-transparent text-[var(--muted)] hover:bg-[#edf2e9] hover:text-[var(--ink)]",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border px-5 py-3 text-sm font-extrabold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : icon}
      <span>{loading ? "Please wait…" : children}</span>
    </button>
  );
}
