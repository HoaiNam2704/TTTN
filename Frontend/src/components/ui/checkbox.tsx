import React from "react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const defaultId = React.useId();
    const checkboxId = id || defaultId;

    return (
      <div className="flex flex-col gap-1 select-none">
        <div className="flex items-start gap-2">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            className={`mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer ${className}`}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-xs text-gray-600 cursor-pointer leading-tight"
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="text-xs text-red-600 pl-6">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
