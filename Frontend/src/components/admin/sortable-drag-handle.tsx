"use client";

import type { ButtonHTMLAttributes } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableDragHandleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

export function SortableDragHandle({
  disabled,
  className,
  ...props
}: SortableDragHandleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Drag to reorder"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-stone-400 transition-colors",
        "hover:bg-stone-100 hover:text-stone-600 active:cursor-grabbing",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-400",
        className
      )}
      {...props}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
