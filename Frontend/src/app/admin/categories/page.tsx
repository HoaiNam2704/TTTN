"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Code2,
  LayoutGrid,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { AdminTablePagination } from "@/components/admin/admin-table-pagination";
import { AdminInput, Textarea } from "@/components/ui/textarea";
import { categoryService } from "@/services/category.service";
import type { ApiError } from "@/services/api";
import type { CategoryResponseDto } from "@/types/category";

const PAGE_SIZE = 10;

const ICON_OPTIONS = [
  { id: "code", Icon: Code2 },
  { id: "palette", Icon: LayoutGrid },
  { id: "chart", Icon: TrendingUp },
  { id: "star", Icon: Star },
] as const;

const CATEGORY_COLORS = [
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-pink-50 text-pink-700",
];

function getErrorMessage(error: unknown, fallback: string) {
  return (error as ApiError)?.message || fallback;
}

function getCategoryColor(categoryId: string) {
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

function CategoryIcon({ index }: { index: number }) {
  const { Icon } = ICON_OPTIONS[index % ICON_OPTIONS.length];
  return <Icon className="h-5 w-5" />;
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [page, setPage] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponseDto | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryResponseDto | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const isRefreshingRef = useRef(false);

  const {
    data: categoriesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories({ size: 100 }),
  });

  const categories = useMemo(() => categoriesData?.content ?? [], [categoriesData]);
  const totalCategories = categories.length;
  const totalPages = Math.max(Math.ceil(totalCategories / PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages - 1);
  const pagedCategories = categories.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      categoryService.createCategory(payload),
    onSuccess: () => {
      resetForm();
      setIsFormOpen(false);
      addToast({ type: "success", message: "Category created successfully." });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => {
      addToast({ type: "error", message: getErrorMessage(err, "Failed to create category.") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: { name: string; description?: string };
    }) => categoryService.updateCategory(categoryId, data),
    onSuccess: () => {
      resetForm();
      setIsFormOpen(false);
      setEditingCategory(null);
      addToast({ type: "success", message: "Category updated successfully." });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => {
      addToast({ type: "error", message: getErrorMessage(err, "Failed to update category.") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      setCategoryToDelete(null);
      addToast({ type: "success", message: "Category deleted successfully." });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => {
      addToast({ type: "error", message: getErrorMessage(err, "Failed to delete category.") });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedIcon("star");
    setEditingCategory(null);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (category: CategoryResponseDto) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setSelectedIcon("star");
    setIsFormOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
    };

    if (editingCategory) {
      updateMutation.mutate({ categoryId: editingCategory.id, data: payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    deleteMutation.mutate(categoryToDelete.id);
  };

  const handleRefresh = async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const deletingId = deleteMutation.isPending ? deleteMutation.variables : null;
  const isEditing = !!editingCategory;

  const columns: AdminTableColumn<CategoryResponseDto>[] = [
    {
      key: "category",
      header: "Category",
      cellClassName: "whitespace-normal px-5 py-2.5 align-middle",
      cell: (cat, index) => (
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-stone-600">
            <CategoryIcon index={safePage * PAGE_SIZE + index} />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold leading-5 text-stone-900">{cat.name}</span>
            {cat.description ? (
              <span className="mt-1 line-clamp-1 text-xs text-stone-500">{cat.description}</span>
            ) : (
              <span
                className={cn(
                  "mt-1 w-max rounded-full px-2 py-0.5 text-[10px] font-medium leading-none",
                  getCategoryColor(cat.id)
                )}
              >
                Category
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      cellClassName: "px-5 py-2.5 align-middle font-mono text-xs text-stone-500",
      cell: (cat) => cat.slug || "updating",
    },
    {
      key: "courseCount",
      header: "Course",
      headerClassName: "text-center",
      cellClassName: "px-5 py-2.5 text-center align-middle tabular-nums text-sm text-stone-700",
      cell: (cat) => cat.courseCount ?? 0,
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-16 px-5 text-center",
      cellClassName: "w-16 px-5 py-2.5 text-center align-middle",
      cell: (cat) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-gray-100 focus:outline-none">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-38">
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 text-sm"
              onClick={() => openEditForm(cat)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={deletingId === cat.id}
              onClick={() => setCategoryToDelete(cat)}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Trash2 className="h-4 w-4" />
              {deletingId === cat.id ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title="Category management" searchPlaceholder="Search categories..." />

      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50",
              isRefreshing && "pointer-events-none cursor-wait"
            )}
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </button>
          <div className="flex-1" />
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreateForm}
          >
            Add new category
          </Button>
        </div>

        <AdminTable
          columns={columns}
          data={pagedCategories}
          getRowId={(cat) => cat.id}
          isLoading={isLoading}
          loadingMessage="Loading categories..."
          emptyMessage="No categories yet."
          footer={
            <AdminTablePagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              summary={`Total ${totalCategories} categories`}
            />
          }
        />
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open && isSubmitting) return;
          setIsFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent
          className="gap-5 rounded-[20px] border-0 bg-white p-6 shadow-2xl ring-1 ring-black/5 sm:max-w-[480px]"
          overlayClassName="bg-black/40 backdrop-blur-[2px] duration-200"
        >
          <DialogHeader className="gap-1.5 text-left">
            <DialogTitle className="text-xl font-bold text-stone-900">
              {isEditing ? "Edit category" : "Add new category"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditing
                ? "Update the name and description for this category."
                : "Create a new category to organize courses."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AdminInput
              label="Category name"
              placeholder="Enter category name..."
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Textarea
              label="Description"
              placeholder="Short description of the category..."
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <div>
              <label className="select-none text-xs font-semibold text-stone-600">
                Icon
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                {ICON_OPTIONS.map(({ id, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedIcon(id)}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                      selectedIcon === id
                        ? "border-2 border-primary bg-accent text-primary"
                        : "border border-border bg-secondary text-stone-500 hover:border-stone-300"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="mx-0 mb-0 grid grid-cols-2 gap-3 border-0 bg-transparent p-0 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="h-11 w-full"
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="h-11 w-full">
                {isEditing ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
        title="Delete category?"
        description={
          <>
            {categoryToDelete?.name} will be permanently deleted. This action cannot be undone.
          </>
        }
        confirmLabel="Delete category"
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
