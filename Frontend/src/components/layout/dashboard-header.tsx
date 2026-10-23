"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { UserAccountMenu } from "@/components/layout/user-account-menu";

export function DashboardHeader() {
  const pathname = usePathname();

  const isDashboard = pathname === ROUTES.DASHBOARD;
  const isCategories =
    pathname === ROUTES.CATEGORIES || pathname.startsWith("/categories/");
  const isMyCourses = pathname === ROUTES.MY_COURSES;
  const isQuiz = pathname.startsWith(ROUTES.QUIZ);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 lg:px-8">
        <Link
          href={ROUTES.DASHBOARD}
          className="shrink-0 text-base font-semibold text-foreground"
        >
          ITIS Academy
        </Link>

        <nav className="hidden h-full items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link
            href={ROUTES.DASHBOARD}
            className={cn(
              "flex h-full items-center border-b-2 font-medium transition-colors",
              isDashboard
                ? "border-primary text-foreground"
                : "border-transparent hover:text-foreground"
            )}
          >
            Dashboard
          </Link>
          <Link
            href={ROUTES.CATEGORIES}
            className={cn(
              "flex h-full items-center border-b-2 font-medium transition-colors",
              isCategories
                ? "border-primary text-foreground"
                : "border-transparent hover:text-foreground"
            )}
          >
            Categories
          </Link>
          <Link
            href={ROUTES.QUIZ}
            className={cn(
              "flex h-full items-center border-b-2 font-medium transition-colors",
              isQuiz
                ? "border-primary text-foreground"
                : "border-transparent hover:text-foreground"
            )}
          >
            Practice
          </Link>
          <Link
            href={ROUTES.MY_COURSES}
            className={cn(
              "flex h-full items-center border-b-2 font-medium transition-colors",
              isMyCourses
                ? "border-primary text-foreground"
                : "border-transparent hover:text-foreground"
            )}
          >
            My courses
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <UserAccountMenu />
        </div>
      </div>
    </header>
  );
}
