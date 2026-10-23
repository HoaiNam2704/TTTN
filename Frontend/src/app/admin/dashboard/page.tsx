"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, LayoutGrid, PlayCircle, Users, Plus } from "lucide-react";
import { AdminHeader, AdminBreadcrumb } from "@/components/layout/admin-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { courseService } from "@/services/course.service";
import { categoryService } from "@/services/category.service";
import { lessonService } from "@/services/lesson.service";

export default function AdminDashboardPage() {
  // Fetch dynamic counts from services
  const { data: coursesPage, isLoading: isCoursesLoading } = useQuery({
    queryKey: ["admin-courses-count"],
    queryFn: () => courseService.getCourses({ size: 1 }),
  });

  const { data: categoriesPage, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["admin-categories-count"],
    queryFn: () => categoryService.getCategories({ size: 1 }),
  });

  const { data: lessonsPage, isLoading: isLessonsLoading } = useQuery({
    queryKey: ["admin-lessons-count"],
    queryFn: () => lessonService.getLessons({ size: 1 }),
  });

  const stats = useMemo(() => {
    return {
      courses: coursesPage?.totalElements ?? 0,
      categories: categoriesPage?.totalElements ?? 0,
      lessons: lessonsPage?.totalElements ?? 0,
    };
  }, [coursesPage, categoriesPage, lessonsPage]);

  const isLoading = isCoursesLoading || isCategoriesLoading || isLessonsLoading;

  return (
    <>
      <AdminHeader title="System overview" showSearch={false} />

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <AdminBreadcrumb
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Overview" },
          ]}
        />

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-stone-850">LMS Control Center</h2>
            <p className="text-sm text-stone-500 mt-1">
              Overview of training activity, lessons, and digital content management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/courses/new">
              <Button variant="outline" className="h-9 text-xs" leftIcon={<Plus className="h-4 w-4" />}>
                Add course
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Courses Card */}
          <Card className="hover:shadow-md transition bg-white p-5 border border-stone-200 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Courses
              </span>
              <div className="p-2 rounded-lg bg-secondary text-primary transition-colors group-hover:bg-accent">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-stone-850 tabular-nums">
                {isLoading ? "..." : stats.courses}
              </span>
              <span className="block text-xs text-stone-400 mt-1">Courses currently on the system</span>
            </div>
          </Card>

          {/* Lessons Card */}
          <Card className="hover:shadow-md transition bg-white p-5 border border-stone-200 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Video lessons
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                <PlayCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-stone-850 tabular-nums">
                {isLoading ? "..." : stats.lessons}
              </span>
              <span className="block text-xs text-stone-400 mt-1">Lessons uploaded</span>
            </div>
          </Card>

          {/* Categories Card */}
          <Card className="hover:shadow-md transition bg-white p-5 border border-stone-200 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Categories
              </span>
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
                <LayoutGrid className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-stone-850 tabular-nums">
                {isLoading ? "..." : stats.categories}
              </span>
              <span className="block text-xs text-stone-400 mt-1">Training topics categorized</span>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-stone-800">Quick actions</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/courses/new" className="block w-full">
              <div className="flex h-full items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition cursor-pointer hover:border-primary hover:shadow-sm">
                <div className="rounded-lg bg-secondary p-2.5 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-850">Create course</h4>
                  <p className="mt-0.5 text-xs text-stone-400">Add a new course to the system</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/categories" className="block w-full">
              <div className="flex h-full items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition cursor-pointer hover:border-primary hover:shadow-sm">
                <div className="rounded-lg bg-teal-50 p-2.5 text-teal-600">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-850">Topic categories</h4>
                  <p className="mt-0.5 text-xs text-stone-400">Organize and sort courses</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/users/import" className="block w-full">
              <div className="flex h-full items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 transition cursor-pointer hover:border-primary hover:shadow-sm">
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-850">Import students</h4>
                  <p className="mt-0.5 text-xs text-stone-400">Upload a student list from CSV</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
