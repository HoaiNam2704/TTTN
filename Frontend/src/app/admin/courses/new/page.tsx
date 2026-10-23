"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminHeader, AdminBreadcrumb } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminInput, Textarea } from "@/components/ui/textarea";
import { FilterSelect } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import { categoryService } from "@/services/category.service";
import { courseService } from "@/services/course.service";
import type { ApiError } from "@/services/api";
import type { CourseLevel, CourseStatus } from "@/types/course";

export default function NewCoursePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    level: "BEGINNER" as CourseLevel,
    status: "DRAFT" as CourseStatus,
    price: "",
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getCategories({ size: 100 }),
  });
  const categories = useMemo(() => categoriesData?.content ?? [], [categoriesData]);

  useEffect(() => {
    if (categories.length > 0 && !form.categoryId) {
      const timer = setTimeout(() => {
        setForm((current) => ({
          ...current,
          categoryId: String(categories[0].id),
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [categories, form.categoryId]);

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof courseService.createCourse>[0]) =>
      courseService.createCourse(data),
    onSuccess: () => {
      addToast({
        type: "success",
        message: "Course created successfully. Redirecting to the list...",
      });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      setTimeout(() => router.push(ROUTES.ADMIN_COURSES), 700);
    },
    onError: (submitError: unknown) => {
      addToast({
        type: "error",
        message: (submitError as ApiError)?.message || "Failed to create course.",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId,
      level: form.level,
      status: form.status,
      price: form.price ? Number(form.price) : undefined,
      thumbnail: thumbnailFile,
    });
  };

  const isSubmitting = createMutation.isPending;

  return (
    <>
      <AdminHeader title="Add new course" showSearch={false} />

      <form className="px-6 py-4" onSubmit={handleSubmit}>
        <AdminBreadcrumb
          items={[
            { label: "Course", href: ROUTES.ADMIN_COURSES },
            { label: "Add new" },
          ]}
        />
        <div className="flex items-center justify-between mt-2 mb-6">
          <h2 className="text-2xl font-bold text-stone-800">Add new course</h2>
          <div className="flex items-center gap-2">
            <Link href={ROUTES.ADMIN_COURSES}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting} disabled={isLoadingCategories}>
              Create course
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 items-start">
          {/* Left column: main info */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <AdminInput
                label="Course title"
                placeholder="Enter course title..."
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
              <Textarea
                label="Description"
                placeholder="Short description of the course..."
                rows={5}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
              <div className="w-full flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-stone-600 select-none">
                  Category
                </span>
                <FilterSelect
                  value={form.categoryId}
                  onChange={(val) =>
                    setForm((current) => ({ ...current, categoryId: val }))
                  }
                  options={categories.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                  }))}
                  placeholder={isLoadingCategories ? "Loading..." : "No categories yet"}
                  searchable={true}
                  clearable={false}
                  disabled={isLoadingCategories || categories.length === 0}
                  className="w-full h-10 bg-secondary border-border rounded-xl text-stone-800"
                />
              </div>
            </div>
          </Card>

          {/* Right column: settings */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="w-full flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-stone-600 select-none">
                  Level
                </span>
                <FilterSelect
                  value={form.level}
                  onChange={(val) =>
                    setForm((current) => ({ ...current, level: val as CourseLevel }))
                  }
                  options={[
                    { value: "BEGINNER", label: "Beginner" },
                    { value: "INTERMEDIATE", label: "Intermediate" },
                    { value: "ADVANCED", label: "Advanced" },
                  ]}
                  searchable={false}
                  clearable={false}
                  className="w-full h-10 bg-secondary border-border rounded-xl text-stone-800"
                />
              </div>
              <div className="w-full flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-stone-600 select-none">
                  Status
                </span>
                <FilterSelect
                  value={form.status}
                  onChange={(val) =>
                    setForm((current) => ({ ...current, status: val as CourseStatus }))
                  }
                  options={[
                    { value: "DRAFT", label: "Draft" },
                    { value: "PUBLISHED", label: "Published" },
                    { value: "ARCHIVED", label: "Archived" },
                  ]}
                  searchable={false}
                  clearable={false}
                  className="w-full h-10 bg-secondary border-border rounded-xl text-stone-800"
                />
              </div>
              <AdminInput
                label="Price (VND)"
                placeholder="0"
                type="number"
                min="0"
                step="any"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              />
              <ImageUpload
                label="Thumbnail"
                value={thumbnailFile}
                onChange={setThumbnailFile}
              />
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
