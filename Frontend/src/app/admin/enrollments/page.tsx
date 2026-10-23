"use client";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/select";
import { BookOpen, ClipboardList, GraduationCap } from "lucide-react";
import { useState } from "react";

interface EnrollmentType {
  id: string;
  student: string;
  initials: string;
  course: string;
  enrolled: string;
  status: "active" | "completed" | "expired";
  progress: number;
}

const ADMIN_ENROLLMENTS: EnrollmentType[] = [];

const STATUS_MAP = {
  active: { label: "In progress", variant: "success" as const },
  completed: { label: "Completed", variant: "info" as const },
  expired: { label: "Expired", variant: "danger" as const },
};

const columns: AdminTableColumn<EnrollmentType>[] = [
  {
    key: "student",
    header: "Student",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle",
    cell: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-stone-600">
          {row.initials}
        </div>
        <span className="font-medium text-stone-800">{row.student}</span>
      </div>
    ),
  },
  {
    key: "course",
    header: "Course",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle text-stone-600",
    cell: (row) => row.course,
  },
  {
    key: "enrolled",
    header: "Enrolled on",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle text-stone-500",
    cell: (row) => row.enrolled,
  },
  {
    key: "progress",
    header: "Progress",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle",
    cell: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 max-w-[100px] flex-1 rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${row.progress}%` }} />
        </div>
        <span className="text-xs text-stone-500">{row.progress}%</span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    headerClassName: "uppercase",
    cellClassName: "px-5 py-3.5 align-middle",
    cell: (row) => {
      const status = STATUS_MAP[row.status];
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
  },
];

export default function ADMIN_ENROLLMENTSPage() {
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("");

  return (
    <>
      <AdminHeader title="Enrollment management" searchPlaceholder="Search enrollments..." />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total enrollments" value="0" icon={<ClipboardList className="h-5 w-5" />} />
          <StatCard title="In progress" value="0" icon={<BookOpen className="h-5 w-5" />} />
          <StatCard title="Completed" value="0" icon={<GraduationCap className="h-5 w-5" />} />
        </div>

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
              { value: "active", label: "In progress" },
              { value: "completed", label: "Completed" },
            ]}
          />
        </div>

        <AdminTable
          columns={columns}
          data={ADMIN_ENROLLMENTS}
          getRowId={(row) => row.id}
          emptyMessage="No enrollments yet."
        />
      </div>
    </>
  );
}
