"use client";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterSelect } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";

interface LessonType {
  id: string;
  title: string;
  course: string;
  duration: string;
  status: "published" | "draft";
}

const LESSONS: LessonType[] = [];

const columns: AdminTableColumn<LessonType>[] = [
  {
    key: "title",
    header: "Title",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle font-medium text-stone-800",
    cell: (lesson) => lesson.title,
  },
  {
    key: "course",
    header: "Course",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle text-stone-600",
    cell: (lesson) => lesson.course,
  },
  {
    key: "duration",
    header: "Duration",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle text-stone-500",
    cell: (lesson) => lesson.duration,
  },
  {
    key: "status",
    header: "Status",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle",
    cell: (lesson) => (
      <Badge variant={lesson.status === "published" ? "success" : "warning"} dot>
        {lesson.status === "published" ? "PUBLISHED" : "DRAFT"}
      </Badge>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle",
    cell: () => (
      <div className="flex items-center gap-2">
        <button className="text-xs font-semibold text-sky-600 hover:text-sky-700">Edit</button>
        <button className="text-xs font-semibold text-red-500 hover:text-red-600">Delete</button>
      </div>
    ),
  },
];

export default function LessonsPage() {
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("");

  return (
    <>
      <AdminHeader title="Lesson management" searchPlaceholder="Search lessons..." />

      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            value={course}
            onChange={setCourse}
            placeholder="Course"
            options={[
              { value: "web", label: "Web Fullstack" },
              { value: "design", label: "UI/UX Design" },
            ]}
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            placeholder="Status"
            options={[
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
          />
          <div className="flex-1" />
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>Add new lesson</Button>
        </div>

        <AdminTable
          columns={columns}
          data={LESSONS}
          getRowId={(lesson) => lesson.id}
          emptyMessage="No lessons yet."
        />
      </div>
    </>
  );
}
