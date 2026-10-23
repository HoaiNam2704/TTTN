"use client";

import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: AdminModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <Card
        className={cn(
          "relative z-10 w-full max-w-3xl overflow-hidden border-[#e8e4df] bg-white shadow-2xl",
          className
        )}
        padding="none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#ebe6e1] px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900">{title}</h3>
            {description && (
              <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="border-t border-[#ebe6e1] px-5 py-4">{footer}</div>
        )}
      </Card>
    </div>
  );
}
