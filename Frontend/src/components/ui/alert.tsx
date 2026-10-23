"use client";

import * as React from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertType = "success" | "error" | "info" | "warning";

const TITLE_BY_TYPE: Record<AlertType, string> = {
  success: "Success",
  error: "Error",
  info: "Info",
  warning: "Warning",
};

const ICON_BY_TYPE: Record<AlertType, React.ReactNode> = {
  success: <CheckCircle2 className="size-4" />,
  error: <CircleAlert className="size-4" />,
  info: <Info className="size-4" />,
  warning: <CircleAlert className="size-4" />,
};

/** shadcn-style default alert shell — black / white only */
function AlertRoot({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(
        "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm",
        "has-[>svg]:grid-cols-[calc(1rem)_1fr] has-[>svg]:gap-x-3",
        "[&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-stone-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight text-stone-900",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-stone-600 [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export interface AlertProps {
  type?: AlertType;
  message: string;
  title?: string;
  className?: string;
  onClose?: () => void;
}

/** Convenience Alert used across the app — always black / white shadcn look. */
export function Alert({
  type = "info",
  message,
  title,
  className,
  onClose,
}: AlertProps) {
  return (
    <AlertRoot className={cn(onClose && "pr-10", className)}>
      {ICON_BY_TYPE[type]}
      <AlertTitle>{title ?? TITLE_BY_TYPE[type]}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-0.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      )}
    </AlertRoot>
  );
}

export { AlertRoot, AlertTitle, AlertDescription };
