"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  statusCode?: number;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TITLE_BY_TYPE: Record<Toast["type"], string> = {
  success: "Success",
  error: "Error",
  info: "Info",
  warning: "Warning",
};

const ICON_BY_TYPE: Record<Toast["type"], React.ReactNode> = {
  success: <CheckCircle2 className="size-4" />,
  error: <CircleAlert className="size-4" />,
  info: <Info className="size-4" />,
  warning: <CircleAlert className="size-4" />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm select-none flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const { id, type, message, statusCode, duration = 5000 } = toast;

  React.useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const title =
    type === "error" && statusCode
      ? `Error (${statusCode})`
      : TITLE_BY_TYPE[type];

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto relative grid w-full grid-cols-[calc(1rem)_1fr] items-start gap-x-3 gap-y-0.5 rounded-lg border border-stone-200 bg-white px-4 py-3 pr-10 text-sm text-stone-900 shadow-lg",
        "animate-slide-in-right"
      )}
    >
      <span className="translate-y-0.5 text-stone-700">{ICON_BY_TYPE[type]}</span>
      <div className="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight text-stone-900">
        {title}
      </div>
      <div className="col-start-2 text-sm leading-relaxed text-stone-600 break-words">
        {message}
      </div>
      <button
        type="button"
        onClick={() => onClose(id)}
        className="absolute right-3 top-3 rounded-md p-0.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
        aria-label="Close"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
