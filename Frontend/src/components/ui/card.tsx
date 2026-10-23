import React from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md" }: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-border shadow-sm",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-base font-semibold text-stone-800", className)}>
      {children}
    </h3>
  );
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  iconClassName?: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {title}
          </span>
          <span className="text-2xl font-bold text-stone-800">{value}</span>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trendUp ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend}
            </span>
          )}
        </div>
        <div
          className={cn(
            "rounded-xl p-2.5",
            iconClassName ?? "bg-secondary text-stone-600"
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
