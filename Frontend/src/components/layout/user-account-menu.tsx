"use client";

import Link from "next/link";
import { ChevronDown, Home, LogOut, Shield, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DISPLAY_ROLE_MAP: Record<string, string> = {
  ADMIN: "Admin",
  STUDENT: "Student",
  USER: "Student",
  ITIS_MEMBER: "ITIS Member",
  TEACHER: "Instructor",
  LECTURER: "Instructor",
};

const getAvatarBgColor = (role?: string) => {
  const normalizedRole = role?.toUpperCase();
  if (normalizedRole === "ADMIN") {
    return "bg-zinc-900";
  }
  if (normalizedRole === "TEACHER" || normalizedRole === "LECTURER") {
    return "bg-zinc-700";
  }
  return "bg-zinc-800";
};

interface UserAccountMenuProps {
  /** Show name/role and chevron beside the avatar (admin header). */
  showInlineIdentity?: boolean;
  /** Show link back to student dashboard (admin header). */
  showStudentHomeLink?: boolean;
  /** Fallback display name when username is missing. */
  fallbackName?: string;
  triggerClassName?: string;
}

export function UserAccountMenu({
  showInlineIdentity = false,
  showStudentHomeLink = false,
  fallbackName = "Student",
  triggerClassName,
}: UserAccountMenuProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div
        className="size-9 shrink-0 animate-pulse rounded-full bg-stone-200"
        aria-hidden
      />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex h-9 items-center rounded-lg border border-border bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
        >
          Sign in
        </Link>
        <Link
          href={ROUTES.REGISTER}
          className="hidden h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:inline-flex"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const displayName = user.username || fallbackName;
  const roleLabel = user.role
    ? DISPLAY_ROLE_MAP[user.role.toUpperCase()] || user.role
    : fallbackName === "Admin"
      ? "Admin"
      : "Student";
  const avatarFallback = displayName.charAt(0).toUpperCase();
  const isAdmin = user.role?.toUpperCase() === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "cursor-pointer focus:outline-none",
          showInlineIdentity &&
            "flex items-center gap-2 pl-2 text-left transition-opacity hover:opacity-80",
          triggerClassName
        )}
        aria-label="Account"
        title={`Account: ${displayName}`}
      >
        <Avatar size="default" className="size-9 after:border-border">
          <AvatarFallback
            className={cn(
              "text-sm font-semibold text-white",
              getAvatarBgColor(user.role)
            )}
          >
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        {showInlineIdentity && (
          <>
            <div className="hidden flex-col lg:flex">
              <span className="text-xs font-semibold text-stone-700">
                {displayName}
              </span>
              <span className="text-[10px] text-stone-400">{roleLabel}</span>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-stone-400 lg:block" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="mb-1 border-b border-border/60 px-2.5 py-2">
            <div className="flex flex-col">
              <span className="truncate text-xs font-semibold text-stone-700">
                {displayName}
              </span>
              <span className="truncate text-[10px] text-stone-400">
                {roleLabel}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuItem
            render={<Link href={ROUTES.PROFILE} />}
            className="cursor-pointer px-2.5 py-2"
          >
            <User className="h-4 w-4 text-stone-500 transition-colors group-hover/dropdown-menu-item:text-stone-900" />
            <span className="font-medium text-stone-700 transition-colors group-hover/dropdown-menu-item:text-stone-900">
              Account information
            </span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem
              render={<Link href={ROUTES.ADMIN} />}
              className="cursor-pointer px-2.5 py-2"
            >
              <Shield className="h-4 w-4 text-stone-500 transition-colors group-hover/dropdown-menu-item:text-stone-900" />
              <span className="font-medium text-stone-700 transition-colors group-hover/dropdown-menu-item:text-stone-900">
                Admin Panel
              </span>
            </DropdownMenuItem>
          )}
          {showStudentHomeLink && (
            <DropdownMenuItem
              render={<Link href={ROUTES.DASHBOARD} />}
              className="cursor-pointer px-2.5 py-2"
            >
              <Home className="h-4 w-4 text-stone-500 transition-colors group-hover/dropdown-menu-item:text-stone-900" />
              <span className="font-medium text-stone-700 transition-colors group-hover/dropdown-menu-item:text-stone-900">
                Home (Student)
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 border-border/60" />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => void logout()}
          className="cursor-pointer px-2.5 py-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
