"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Search, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSidebar } from "@/providers/sidebar-provider";
import { UserAccountMenu } from "@/components/layout/user-account-menu";

interface AdminHeaderProps {
  title: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
}

export function AdminHeader({
  title,
  searchPlaceholder = "Search...",
  showSearch = true,
  searchValue,
  onSearchChange,
  actions,
}: AdminHeaderProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-muted/80 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="cursor-pointer rounded-xl p-2 text-stone-500 transition-colors hover:bg-stone-100"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
          <h1 className="shrink-0 text-xl font-bold text-stone-800">{title}</h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {showSearch && (
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {actions}

          <UserAccountMenu
            showInlineIdentity
            showStudentHomeLink
            fallbackName="Admin"
          />
        </div>
      </div>
    </header>
  );
}

export function PageActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

export function AdminBreadcrumb({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <Breadcrumb className={cn("mb-1", className)}>
      <BreadcrumbList className="text-xs text-stone-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={item.label}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage className="font-normal text-stone-600">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={item.href} />}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
