"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BookOpen,
  LayoutGrid,
  List,
  Loader2,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  StudentCourseCard,
  CourseCardSkeleton,
} from "@/components/course/StudentCourseCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/select";
import { courseService } from "@/services/course.service";
import { categoryService } from "@/services/category.service";
import type { CourseLevel, CourseResponseDto } from "@/types/course";
import type { CategoryResponseDto } from "@/types/category";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { IconSearch } from "@/components/common/icons";

type SortOption = "newest" | "title" | "price";
type ViewMode = "grid" | "list";

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

function EmptyState({ query }: { query: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
        <IconSearch className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-foreground">
        {query
          ? `No courses found for "${query}"`
          : "No courses yet"}
      </h3>
      <p className="mt-2 max-w-sm text-base text-muted-foreground">
        {query
          ? "Try a different keyword or clear the filters."
          : "Courses will appear here once they are created."}
      </p>
    </div>
  );
}

function StudentDashboardPageContent() {
  const { user, isAuthenticated } = useAuth();
  const displayName = isAuthenticated && user?.username ? user.username : null;
  const searchParams = useSearchParams();
  const searchParamVal = searchParams?.get("search") || "";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState<CourseLevel | "">("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  useEffect(() => {
    if (searchParamVal) setSearch(searchParamVal);
  }, [searchParamVal]);

  const { data: categoryPage } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories({ size: 100 }),
  });
  const categories: CategoryResponseDto[] = categoryPage?.content ?? [];

  const sortParam =
    sort === "title"
      ? "title,ASC"
      : sort === "price"
        ? "price,ASC"
        : "createdAt,DESC";

  const title = debouncedSearch.trim() || undefined;

  const {
    data: coursePage,
    isPending,
    isFetching,
  } = useQuery({
    queryKey: ["courses", title, categoryId, level, page, sortParam],
    queryFn: () =>
      courseService.getCourses({
        page,
        size: PAGE_SIZE,
        title,
        categoryId: categoryId || undefined,
        level: (level || undefined) as CourseLevel | undefined,
        sort: sortParam,
      }),
    placeholderData: (prev) => prev,
  });
  const isRefreshing = isFetching && !isPending;

  const courses: CourseResponseDto[] = coursePage?.content ?? [];
  const totalPages = coursePage?.totalPages ?? 0;

  const hasActiveFilters = !!categoryId || !!level || !!title;

  const clearFilters = useCallback(() => {
    setCategoryId("");
    setLevel("");
    setSearch("");
    setPage(0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-foreground">
      <DashboardHeader />

      <main className="mx-auto max-w-[1280px] px-5 py-10 sm:px-6 lg:px-8">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section
          aria-label="Welcome"
          className="relative flex min-h-[240px] items-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-white via-white to-zinc-100 p-6 shadow-sm md:min-h-[280px] md:p-8 lg:min-h-[300px]"
        >
          <div className="relative z-10 flex max-w-2xl flex-col justify-center">
            <Badge variant="success" className="w-fit rounded-lg" dot>
              In progress
            </Badge>
            <h1 className="mt-4 text-[32px] font-semibold leading-[1.15] tracking-tight text-foreground md:text-[48px]">
              {displayName ? `Hello, ${displayName}` : "Hello"}
            </h1>
            <p className="mt-3 max-w-lg text-base text-muted-foreground">
              Continue your learning journey — every lesson brings you closer
              to your goals.
            </p>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-zinc-200/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-zinc-300/30 blur-3xl"
          />
        </section>

        {/* ── COURSES ──────────────────────────────────────────────────────── */}
        <section id="courses" aria-labelledby="courses-heading" className="mt-20 md:mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="courses-heading"
                className="text-[28px] font-semibold tracking-tight text-foreground md:text-[32px]"
              >
                Explore courses
              </h2>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <Input
                id="course-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search courses..."
                leftIcon={<Search className="h-4 w-4" />}
                className="h-10 rounded-xl border-border"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
              {categories.length > 0 && (
                <FilterSelect
                  value={categoryId}
                  onChange={(val) => {
                    setCategoryId(val);
                    setPage(0);
                  }}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  placeholder="Categories"
                  searchable
                  className="h-10 min-w-[140px] rounded-xl"
                />
              )}

              <FilterSelect
                value={level}
                onChange={(v) => {
                  setLevel(v as CourseLevel | "");
                  setPage(0);
                }}
                options={[
                  { value: "BEGINNER", label: "Beginner" },
                  { value: "INTERMEDIATE", label: "Intermediate" },
                  { value: "ADVANCED", label: "Advanced" },
                ]}
                placeholder="Level"
                searchable={false}
                className="h-10 min-w-[120px] rounded-xl"
              />

              <FilterSelect
                value={sort}
                onChange={(v) => setSort((v || "newest") as SortOption)}
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "title", label: "Name A–Z" },
                  { value: "price", label: "Price: low to high" },
                ]}
                placeholder="Sort"
                searchable={false}
                clearable={false}
                className="h-10 min-w-[130px] rounded-xl"
              />

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              )}

              {isRefreshing && (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                  aria-label="Loading"
                />
              )}

              <div className="ml-auto flex h-10 items-center rounded-xl border border-border p-0.5">
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors",
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors",
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {(categoryId || level) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryId && (
                <Badge variant="info" className="rounded-lg">
                  {categories.find((c) => c.id === categoryId)?.name}
                </Badge>
              )}
              {level && (
                <Badge variant="info" className="rounded-lg">
                  {LEVEL_LABELS[level]}
                </Badge>
              )}
            </div>
          )}

          <div
            aria-busy={isRefreshing}
            className={cn(
              "mt-8 transition-opacity duration-200",
              viewMode === "grid"
                ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                : "flex flex-col gap-4",
              isRefreshing && "pointer-events-none opacity-55",
            )}
          >
            {isPending
              ? Array.from({ length: viewMode === "grid" ? PAGE_SIZE : 4 }).map(
                  (_, i) => <CourseCardSkeleton key={i} view={viewMode} />,
                )
              : courses.length > 0
                ? courses.map((course) => (
                    <StudentCourseCard
                      key={course.id}
                      course={course}
                      view={viewMode}
                      enrolledView={!!course.isEnrolled}
                    />
                  ))
                : (
                  <EmptyState query={title ?? ""} />
                )}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex items-center justify-center gap-2"
            >
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-sm font-medium transition hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                ‹
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                let pageNum = i;
                if (totalPages > 7) {
                  if (page < 4) pageNum = i;
                  else if (page > totalPages - 5) pageNum = totalPages - 7 + i;
                  else pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    aria-label={`Page ${pageNum + 1}`}
                    aria-current={pageNum === page ? "page" : undefined}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-medium transition",
                      pageNum === page
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-white text-foreground/70 hover:border-foreground/20",
                    )}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-sm font-medium transition hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </nav>
          )}
        </section>

        {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
        <section
          aria-label="Free for ITISers"
          className="mt-20 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-sm md:mt-24"
        >
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
              <Badge className="w-fit rounded-lg border-0 bg-white/10 text-white">
                Exclusive for ITIS members
              </Badge>
              <h2 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight md:text-[32px]">
                Completely free for ITISers
              </h2>
              <p className="mt-3 max-w-md text-base leading-relaxed text-zinc-300">
                A learning platform built by and for Faculty of Information Technology
                students — access all courses, materials, and high-quality lectures
                at no cost.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "All courses free",
                  "High-quality videos",
                  "Continuously updated",
                ].map((text) => (
                  <span
                    key={text}
                    className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-zinc-200"
                  >
                    {text}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative hidden min-h-[280px] items-center justify-center overflow-hidden md:flex">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.12),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.08),transparent_50%)]"
              />
              <div className="relative grid grid-cols-2 gap-3 p-10">
                {[
                  { icon: BookOpen, label: "Courses" },
                  { icon: Award, label: "Certificates" },
                  { icon: LayoutGrid, label: "Learning paths" },
                  { icon: Sparkles, label: "New skills" },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm",
                      i % 2 === 1 && "translate-y-4",
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm font-medium text-zinc-200">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-border bg-white md:mt-24">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-foreground">ITIS ACADEMY</p>
            <p className="mt-0.5 text-sm">
              © {new Date().getFullYear()} ITIS Academy. Professional learning
              platform.
            </p>
          </div>
          <nav className="flex flex-wrap gap-4" aria-label="Footer navigation" />
        </div>
      </footer>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen animate-pulse bg-[#FAFAFA]" />}
    >
      <StudentDashboardPageContent />
    </Suspense>
  );
}
