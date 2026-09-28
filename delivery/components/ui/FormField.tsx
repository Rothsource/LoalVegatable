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
      <label htmlFor={fieldId} className="mb-2 block text-sm font-semibold text-[#35473a]">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? messageId : undefined}
          className={`h-[50px] w-full rounded-lg border border-[#d9dfd8] bg-white px-4 text-sm font-medium text-[#24382d] placeholder:text-[#7a857c] transition outline-none hover:border-[#a8b8aa] focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/15 ${trailing ? "pr-12" : ""} ${error ? "border-red-300 bg-red-50" : ""} ${className}`}
        />
        {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
      </div>
      {(error || hint) && (
        <p id={messageId} className={`mt-2 flex items-start text-xs leading-5 ${error ? "font-semibold text-red-700" : "text-[#68746a]"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
