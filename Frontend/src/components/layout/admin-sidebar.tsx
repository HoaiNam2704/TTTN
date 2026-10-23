"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutGrid,
  LogOut,
  PlayCircle,
  Settings,
  Upload,
  Users,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_GROUPS, ADMIN_BOTTOM_NAV } from "@/constants/nav-items";
import { ROUTES } from "@/constants/routes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/providers/sidebar-provider";

const NAV_ICONS: Record<string, LucideIcon> = {
  book: BookOpen,
  grid: LayoutGrid,
  play: PlayCircle,
  users: Users,
  upload: Upload,
  settings: Settings,
  logout: LogOut,
  home: LayoutDashboard,
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed } = useSidebar();

  const displayRoleMap: Record<string, string> = {
    ADMIN: "Admin",
    STUDENT: "Student",
    TEACHER: "Instructor",
    LECTURER: "Instructor",
  };

  const displayName = user?.username || "Admin";
  const roleLabel = user?.role ? (displayRoleMap[user.role.toUpperCase()] || user.role) : "Admin";
  const avatarFallback = displayName.charAt(0).toUpperCase();

  const isActive = (href: string) => {
    if (href === ROUTES.ADMIN_COURSES) return pathname.startsWith(ROUTES.ADMIN_COURSES);
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300",
        isCollapsed ? "-translate-x-full" : "translate-x-0"
      )}
    >
      <div className="border-b border-sidebar-border px-4 py-4">
        <Link href={ROUTES.ADMIN} className="block">
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            ITIS ACADEMY
          </span>
          <span className="mt-0.5 block text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
            Admin Dashboard
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title ?? "default"} className="mb-3 space-y-0.5">
            {group.title && (
              <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-sidebar-foreground/50">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = NAV_ICONS[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border px-2 py-3">
        {ADMIN_BOTTOM_NAV.map((item) => {
          const Icon = NAV_ICONS[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (item.icon === "logout") {
                  e.preventDefault();
                  logout();
                }
              }}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {item.label}
            </Link>
          );
        })}

        <div className="mt-2 flex items-center gap-2.5 px-2.5 py-2">
          <Avatar size="default" className="size-8 after:border-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</span>
            <span className="truncate text-[11px] text-sidebar-foreground/50">{roleLabel}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
