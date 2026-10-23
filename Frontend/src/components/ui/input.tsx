import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  helperText?: string;
  labelAction?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      leftIcon,
      rightIcon,
      rightElement,
      helperText,
      labelAction,
      id,
      type = "text",
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const isLocked = Boolean(disabled || readOnly);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {(label || labelAction) && (
          <div className="flex justify-between items-center">
            {label && (
              <label
                htmlFor={id}
                className={`text-xs font-medium select-none ${
                  isLocked ? "text-stone-400" : "text-foreground"
                }`}
              >
                {label}
              </label>
            )}
            {labelAction && <div className="text-xs">{labelAction}</div>}
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            id={id}
            ref={ref}
            type={type}
            disabled={disabled}
            readOnly={readOnly}
            className={`w-full h-9 rounded-md border text-sm transition-colors outline-none px-3
              ${leftIcon ? "pl-9" : ""}
              ${rightIcon || rightElement ? "pr-9" : ""}
              ${
                isLocked
                  ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 placeholder:text-stone-300"
                  : error
                    ? "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive bg-background text-foreground"
                    : "border-input focus:border-ring focus:ring-1 focus:ring-ring bg-background text-foreground"
              }
              placeholder:text-muted-foreground
              ${className}
            `}
            {...props}
          />

          {(rightIcon || rightElement) && (
            <div className="absolute right-2.5 flex items-center text-muted-foreground">
              {rightElement || rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-destructive mt-0.5">{error}</p>
        ) : (
          helperText && (
            <p className="text-xs text-muted-foreground mt-0.5">{helperText}</p>
          )
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
