"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  StudentCourseCard,
  CourseCardSkeleton,
} from "@/components/course/StudentCourseCard";
import { categoryService } from "@/services/category.service";
import { courseService } from "@/services/course.service";
import { ROUTES } from "@/constants/routes";
import { IconSearch, IconBook } from "@/components/common/icons";
import { cn } from "@/lib/utils";
import type { CourseLevel } from "@/types/course";

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <IconSearch className="h-10 w-10 text-[#aaa]" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-[#141414]">
        No courses in this category yet
      </h3>
      <p className="mt-2 max-w-sm text-[15px] text-[#666]">
        Check back later or explore other categories.
      </p>
      <Link
        href={ROUTES.CATEGORIES}
        className="mt-6 text-sm font-semibold text-primary transition hover:underline"
      >
        ← View all categories
      </Link>
    </div>
  );
}

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [level, setLevel] = useState<CourseLevel | "">("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  const {
    data: category,
    isLoading: isLoadingCategory,
    isError,
  } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => categoryService.getCategoryBySlug(slug),
    enabled: !!slug,
  });

  const {
    data: coursePage,
    isPending,
    isFetching,
  } = useQuery({
    queryKey: ["courses", "category", category?.id, level, page],
    queryFn: () =>
      courseService.getCourses({
        page,
        size: PAGE_SIZE,
        categoryId: category!.id,
        level: (level || undefined) as CourseLevel | undefined,
        sort: "createdAt,DESC",
      }),
    enabled: !!category?.id,
    placeholderData: (prev) => prev,
  });
  const isRefreshing = isFetching && !isPending;

  const courses = coursePage?.content ?? [];
  const totalPages = coursePage?.totalPages ?? 0;
  const totalElements = coursePage?.totalElements ?? 0;

  if (isError) {
    return (
      <div className="min-h-screen bg-muted text-[#141414]">
        <DashboardHeader />
        <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <IconBook className="h-12 w-12 text-[#aaa]" />
            <h1 className="mt-4 text-xl font-semibold">Category not found</h1>
            <p className="mt-2 text-sm text-[#666]">
              The category you are looking for does not exist or has been removed.
            </p>
            <Link
              href={ROUTES.CATEGORIES}
              className="mt-6 text-sm font-semibold text-primary transition hover:underline"
            >
              ← Back to categories
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted text-[#141414]">
      <DashboardHeader />

      <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
        <nav className="mb-6 text-sm text-[#888]">
          <Link href={ROUTES.DASHBOARD} className="transition hover:text-primary">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <Link href={ROUTES.CATEGORIES} className="transition hover:text-primary">
            Categories
          </Link>
          {category && (
            <>
              <span className="mx-2">/</span>
              <span className="text-[#141414]">{category.name}</span>
            </>
          )}
        </nav>

        <section aria-labelledby="category-heading">
          {isLoadingCategory ? (
            <div className="animate-pulse">
              <div className="h-8 w-64 rounded bg-gray-200" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-200" />
            </div>
          ) : category ? (
            <div>
              <h1
                id="category-heading"
                className="text-2xl font-bold text-[#141414] md:text-3xl"
              >
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-2 max-w-2xl text-sm text-[#666]">
                  {category.description}
                </p>
              )}
              {!isPending && (
                <p className="mt-1 text-sm text-[#888]">
                  {totalElements > 0
                    ? `${totalElements} ${totalElements === 1 ? "course" : "courses"}`
                    : "No courses yet"}
                </p>
              )}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 mr-1">
              <SlidersHorizontal className="h-4 w-4 text-[#888]" />
              <span className="text-sm font-medium text-[#555]">Filter:</span>
            </div>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as CourseLevel | "");
                setPage(0);
              }}
              className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-[#555] transition hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="">All levels</option>
              <option value="BEGINNER">{LEVEL_LABELS.BEGINNER}</option>
              <option value="INTERMEDIATE">{LEVEL_LABELS.INTERMEDIATE}</option>
              <option value="ADVANCED">{LEVEL_LABELS.ADVANCED}</option>
            </select>
            {level && (
              <button
                type="button"
                onClick={() => {
                  setLevel("");
                  setPage(0);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#ccc] bg-white px-4 py-2.5 text-sm text-[#666] transition hover:border-primary hover:text-primary"
              >
                ✕ Clear filters
              </button>
            )}
            {isRefreshing && (
              <Loader2
                className="h-4 w-4 animate-spin text-[#888]"
                aria-label="Loading"
              />
            )}
          </div>

          <div
            aria-busy={isRefreshing}
            className={cn(
              "mt-8 grid gap-6 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              isRefreshing && "pointer-events-none opacity-55"
            )}
          >
            {isPending
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))
              : courses.length > 0
                ? courses.map((course) => (
                    <StudentCourseCard key={course.id} course={course} />
                  ))
                : (
                  <EmptyState />
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

              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
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
                    aria-current={pageNum === page ? "page" : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition ${
                      pageNum === page
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-white text-[#444] hover:border-primary hover:text-primary"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-sm font-medium transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                ›
              </button>
            </nav>
          )}
        </section>
      </main>
    </div>
  );
}
