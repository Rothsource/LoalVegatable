import { AlertCircle } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
};

export function FormField({ label, error, hint, trailing, id, className = "", ...props }: FormFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replaceAll(" ", "-");
  const messageId = `${fieldId}-message`;

  return (
    <div>
      <label htmlFor={fieldId} className="mb-2 block text-sm font-bold text-[#344033]">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={`h-[52px] w-full rounded-[14px] border bg-white px-4 text-[15px] font-medium text-[var(--ink)] placeholder:text-[#98a294] transition outline-none focus:border-[var(--leaf)] focus:ring-4 focus:ring-[#dcebd8] ${trailing ? "pr-12" : ""} ${error ? "border-[#da8d86] bg-[#fffafa]" : "border-[var(--line)]"} ${className}`}
        />
        {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
      </div>
      {(error || hint) && (
        <p id={messageId} className={`mt-2 flex items-start gap-1.5 text-xs leading-5 ${error ? "font-semibold text-[var(--danger)]" : "text-[var(--muted)]"}`}>
          {error && <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />}
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
