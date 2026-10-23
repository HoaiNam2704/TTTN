import React from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "pink";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-stone-100 text-stone-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-700",
  purple: "bg-violet-50 text-violet-700",
  pink: "bg-pink-50 text-pink-700",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-stone-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  purple: "bg-violet-500",
  pink: "bg-pink-500",
};

export function Badge({ children, variant = "default", dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  return (
    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border border-border bg-muted text-stone-600">
      {level}
    </span>
  );
}
