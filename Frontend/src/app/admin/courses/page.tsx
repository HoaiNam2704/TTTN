"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { FilterSelect } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { AdminTablePagination } from "@/components/admin/admin-table-pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { courseService } from "@/services/course.service";
import { categoryService } from "@/services/category.service";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { CourseLevel, CourseResponseDto, CourseStatus } from "@/types/course";
import type { ApiError } from "@/services/api";

const STATUS_MAP = {
  PUBLISHED: { label: "PUBLISHED", variant: "success" as const },
  DRAFT: { label: "DRAFT", variant: "warning" as const },
  ARCHIVED: { label: "ARCHIVED", variant: "default" as const },
};

const CATEGORY_COLORS = [
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-pink-50 text-pink-700",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 0,
});

function formatPrice(price: number) {
  if (price === 0) return <span className="text-stone-400 font-normal text-xs">Free</span>;
  return <>{currencyFormatter.format(price)}<span className="ml-1 text-[10px] font-medium text-stone-400">VND</span></>;
}

function getErrorMessage(error: unknown) {
  return (error as ApiError)?.message || "Failed to load data. Please try again.";
}

function getThumbnailLabel(course: { level: CourseLevel; thumbnailUrl?: string }) {
  if (course.thumbnailUrl) return null;
  if (course.level === "ADVANCED") return "📊";
  if (course.level === "INTERMEDIATE") return "📱";
  return "📚";
}

function getCategoryColor(categoryId: string) {
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const title = debouncedSearch.trim() || undefined;
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseResponseDto | null>(null);
  const isRefreshingRef = useRef(false);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories({ size: 100 }),
  });
  const categories = useMemo(() => categoriesData?.content ?? [], [categoriesData]);

  const { data: coursesPage, isLoading, refetch } = useQuery({
    queryKey: ["courses", { page, title, categoryId, status, level }],
    queryFn: () =>
      courseService.getCourses({
        page,
        size: 10,
        title,
        categoryId: categoryId || undefined,
        status: (status || undefined) as CourseStatus | undefined,
        level: (level || undefined) as CourseLevel | undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const categoryNameById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => courseService.deleteCourse(id),
    onSuccess: () => {
      setCourseToDelete(null);
      addToast({ type: "success", message: "Course deleted successfully." });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (deleteError) => {
      addToast({ type: "error", message: getErrorMessage(deleteError) });
    },
  });

  const openDeleteModal = (course: CourseResponseDto) => {
    setCourseToDelete(course);
  };

  const handleConfirmDelete = () => {
    if (!courseToDelete) return;
    deleteMutation.mutate(courseToDelete.id);
  };

  const deletingId = deleteMutation.isPending ? deleteMutation.variables : null;
  const totalCourses = coursesPage?.totalElements ?? 0;
  const totalPages = Math.max(coursesPage?.totalPages ?? 1, 1);

  const columns: AdminTableColumn<CourseResponseDto>[] = [
    {
      key: "course",
      header: "Course",
      cellClassName: "whitespace-normal px-5 py-2.5 align-middle",
      cell: (course) => {
        const thumbnailLabel = getThumbnailLabel(course);

        return (
          <div className="flex items-center gap-3">
            {course.thumbnailUrl ? (
              <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-secondary text-xl">
                {thumbnailLabel}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-5 text-stone-900">
                {course.title}
              </span>
              <span
                className={cn(
                  "mt-1 w-max rounded-full px-2 py-0.5 text-[10px] font-medium leading-none",
                  getCategoryColor(course.categoryId)
                )}
              >
                {categoryNameById.get(course.categoryId) || "Uncategorized"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "px-5 py-2.5 text-center align-middle",
      cell: (course) => {
        const courseStatus = STATUS_MAP[course.status ?? "DRAFT"];

        return (
          <div className="flex justify-center">
            <Badge variant={courseStatus.variant} dot>
              {courseStatus.label}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "price",
      header: "Price",
      headerClassName: "text-right",
      cellClassName: "px-5 py-2.5 text-right align-middle font-semibold text-stone-700 tabular-nums",
      cell: (course) => formatPrice(course.price ?? 0),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-16 px-5 text-center",
      cellClassName: "w-16 px-5 py-2.5 text-center align-middle",
      cell: (course) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-gray-100 focus:outline-none">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-38">
            <DropdownMenuItem className="cursor-pointer p-0">
              <Link
                href={`/admin/courses/${course.id}/sections`}
                className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium"
              >
                <FolderOpen className="h-4 w-4" />
                Manage sections
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer p-0">
              <Link
                href={ROUTES.ADMIN_COURSE_EDIT(course.id)}
                className="flex w-full items-center gap-2 px-1.5 py-1 text-sm"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={deletingId === course.id}
              onClick={() => openDeleteModal(course)}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              {deletingId === course.id ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title="Course management" showSearch={false} />

      <div className="space-y-6 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <AdminSearchInput
            id="admin-course-search"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            placeholder="Search courses..."
          />
          <FilterSelect
            value={categoryId}
            onChange={(val) => { setCategoryId(val); setPage(0); }}
            placeholder="Category"
            className="min-w-[160px]"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
          <FilterSelect
            value={status}
            onChange={(val) => { setStatus(val); setPage(0); }}
            placeholder="Status"
            className="min-w-[130px]"
            options={[
              { value: "PUBLISHED", label: "Published" },
              { value: "DRAFT", label: "Draft" },
              { value: "ARCHIVED", label: "Archived" },
            ]}
          />
          <FilterSelect
            value={level}
            onChange={(val) => { setLevel(val); setPage(0); }}
            placeholder="Level"
            className="min-w-[120px]"
            options={[
              { value: "BEGINNER", label: "Beginner" },
              { value: "INTERMEDIATE", label: "Intermediate" },
              { value: "ADVANCED", label: "Advanced" },
            ]}
          />
          <button
            type="button"
            onClick={async () => {
              if (isRefreshingRef.current) return;
              isRefreshingRef.current = true;
              setIsRefreshing(true);
              try {
                await refetch();
              } finally {
                isRefreshingRef.current = false;
                setIsRefreshing(false);
              }
            }}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50",
              isRefreshing && "pointer-events-none cursor-wait"
            )}
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </button>
          <div className="flex-1" />
          <Link href={ROUTES.ADMIN_COURSE_NEW}>
            <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>Add new course</Button>
          </Link>
        </div>

        {/* Table */}
        <AdminTable
          columns={columns}
          data={coursesPage?.content ?? []}
          getRowId={(course) => course.id}
          isLoading={isLoading}
          loadingMessage="Loading courses..."
          emptyMessage="No courses yet."
          footer={
            <AdminTablePagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              summary={`Total ${totalCourses} courses`}
            />
          }
        />
      </div>

      <ConfirmDeleteDialog
        open={!!courseToDelete}
        onOpenChange={(open) => {
          if (!open) setCourseToDelete(null);
        }}
        title="Delete course?"
        description={
          <>
            {courseToDelete?.title} will be permanently deleted along with all sections and lessons. This action
            cannot be undone.
          </>
        }
        confirmLabel="Delete course"
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
