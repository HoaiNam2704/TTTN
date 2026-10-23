"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { categoryService } from "@/services/category.service";
import { ROUTES } from "@/constants/routes";
import { IconBook } from "@/components/common/icons";
import type { CategoryResponseDto } from "@/types/category";

const CATEGORY_COLORS = [
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
];

function getCategoryColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

function CategoryCard({ category }: { category: CategoryResponseDto }) {
  const slug = category.slug ?? category.id;
  const colorClass = getCategoryColor(category.id);
  const courseCount = category.courseCount ?? 0;

  return (
    <Link
      href={ROUTES.CATEGORY_DETAIL(slug)}
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${colorClass}`}
      >
        <IconBook className="h-5 w-5" />
      </div>
      <h3 className="text-[15px] font-semibold text-[#141414] transition-colors group-hover:text-primary">
        {category.name}
      </h3>
      {category.description && (
        <p className="mt-1.5 line-clamp-2 text-[13px] text-[#666]">
          {category.description}
        </p>
      )}
      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {courseCount} {courseCount === 1 ? "course" : "courses"}
      </p>
    </Link>
  );
}

function CategorySkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-border bg-card p-5">
      <div className="mb-4 h-10 w-10 rounded-lg bg-gray-200" />
      <div className="h-5 w-2/3 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-full rounded bg-gray-200" />
    </div>
  );
}

export default function CategoriesPage() {
  const { data: categoryPage, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories({ size: 100 }),
  });

  const categories = categoryPage?.content ?? [];

  return (
    <div className="min-h-screen bg-muted text-[#141414]">
      <DashboardHeader />

      <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
        <section aria-labelledby="categories-page-heading">
          <div>
            <h1
              id="categories-page-heading"
              className="text-2xl font-bold text-[#141414] md:text-3xl"
            >
              Course categories
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#666]">
              Explore learning topics and find courses that match your goals.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoadingCategories
              ? Array.from({ length: 8 }).map((_, i) => (
                  <CategorySkeleton key={i} />
                ))
              : categories.length > 0
                ? categories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))
                : (
                    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                        <IconBook className="h-10 w-10 text-[#aaa]" />
                      </div>
                      <h3 className="mt-6 text-xl font-semibold text-[#141414]">
                        No categories yet
                      </h3>
                      <p className="mt-2 max-w-sm text-[15px] text-[#666]">
                        Course categories will appear here once they are created.
                      </p>
                      <Link
                        href={ROUTES.DASHBOARD}
                        className="mt-6 text-sm font-semibold text-primary transition hover:underline"
                      >
                        ← Back to Dashboard
                      </Link>
                    </div>
                  )}
          </div>
        </section>
      </main>
    </div>
  );
}
