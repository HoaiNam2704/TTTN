"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutGrid,
  List,
  Loader2,
  Search,
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
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { IconBook } from "@/components/common/icons";
import type { CourseLevel, CourseResponseDto } from "@/types/course";
import type { CategoryResponseDto } from "@/types/category";

type SortOption = "newest" | "title" | "price";
type ViewMode = "grid" | "list";

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const PAGE_SIZE = 12;

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <IconBook className="h-10 w-10 text-[#aaa]" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-[#141414]">
        {hasFilters
          ? "No matching courses found"
          : "You have not enrolled in any courses yet"}
      </h3>
      <p className="mt-2 max-w-sm text-[15px] text-[#666]">
        {hasFilters
          ? "Try changing the filters or search keywords."
          : "Explore courses on the Dashboard and start your learning journey today."}
      </p>
      {!hasFilters && (
        <Link
          href={ROUTES.DASHBOARD}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Explore courses
        </Link>
      )}
    </div>
  );
}

export default function MyCoursesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState<CourseLevel | "">("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(0);

  const title = debouncedSearch.trim() || undefined;

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

  const {
    data: coursePage,
    isPending,
    isFetching,
  } = useQuery({
    queryKey: [
      "my-courses",
      user?.userId,
      title,
      categoryId,
      level,
      page,
      sortParam,
    ],
    queryFn: () =>
      courseService.getCoursesByUserId(user!.userId, {
        page,
        size: PAGE_SIZE,
        title,
        categoryId: categoryId || undefined,
        level: (level || undefined) as CourseLevel | undefined,
        sort: sortParam,
      }),
    enabled: !!user?.userId,
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
    <div className="min-h-screen bg-muted text-[#141414]">
      <DashboardHeader />

      <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
        <section aria-labelledby="my-courses-heading">
          <div>
            <h1
              id="my-courses-heading"
              className="text-2xl font-bold text-[#141414] md:text-3xl"
            >
              My courses
            </h1>
          </div>

          {isAuthLoading ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : !user ? (
            <div className="mt-8 flex flex-col items-center justify-center py-24 text-center">
              <p className="text-[#666]">
                Please sign in to view your courses.
              </p>
              <Link
                href={ROUTES.LOGIN}
                className="mt-4 text-sm font-semibold text-primary transition hover:underline"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <Input
                    id="my-course-search"
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
                    onChange={(v) => {
                      setSort((v || "newest") as SortOption);
                      setPage(0);
                    }}
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
                          : "text-muted-foreground hover:text-foreground"
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
                          : "text-muted-foreground hover:text-foreground"
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
                    ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "flex flex-col gap-4",
                  isRefreshing && "pointer-events-none opacity-55"
                )}
              >
                {isPending
                  ? Array.from({
                      length: viewMode === "grid" ? PAGE_SIZE : 4,
                    }).map((_, i) => (
                      <CourseCardSkeleton key={i} view={viewMode} />
                    ))
                  : courses.length > 0
                    ? courses.map((course) => (
                        <StudentCourseCard
                          key={course.id}
                          course={course}
                          enrolledView
                          view={viewMode}
                        />
                      ))
                    : (
                        <EmptyState hasFilters={hasActiveFilters} />
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
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-sm font-medium transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    ‹
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }).map(
                    (_, i) => {
                      let pageNum = i;
                      if (totalPages > 7) {
                        if (page < 4) {
                          pageNum = i;
                        } else if (page > totalPages - 5) {
                          pageNum = totalPages - 7 + i;
                        } else {
                          pageNum = page - 3 + i;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setPage(pageNum)}
                          aria-label={`Page ${pageNum + 1}`}
                          aria-current={
                            pageNum === page ? "page" : undefined
                          }
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition ${
                            pageNum === page
                              ? "border-primary bg-primary text-white shadow-sm"
                              : "border-border bg-white text-[#444] hover:border-primary hover:text-primary"
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    }
                  )}

                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-sm font-medium transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
