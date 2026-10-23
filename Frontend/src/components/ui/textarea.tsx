import React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold text-stone-600 select-none">
            {label}
          </label>
        )}
        <textarea
          id={id}
          ref={ref}
          className={cn(
            "w-full rounded-md border text-sm transition-colors outline-none py-2 px-3 resize-none min-h-[80px]",
            "bg-background border-input text-foreground placeholder:text-muted-foreground",
            "focus:border-ring focus:ring-1 focus:ring-ring",
            error && "border-destructive focus:border-destructive focus:ring-destructive",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : (
          helperText && <p className="text-xs text-stone-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export function SearchInput({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
      />
    </div>
  );
}

export function AdminInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-stone-600 select-none">
          {label}
        </label>
      )}
      <input
        className="w-full rounded-xl border text-sm transition-all duration-200 outline-none py-2.5 px-3.5 bg-secondary border-border text-stone-800 placeholder-stone-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
        {...props}
      />
    </div>
  );
}
