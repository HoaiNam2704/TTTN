"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus, Pencil, Trash2, FolderOpen, BookOpen, MoreVertical } from "lucide-react";
import { AdminHeader, AdminBreadcrumb } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { AdminInput, Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { ReorderDirtyBar } from "@/components/admin/reorder-dirty-bar";
import { courseService } from "@/services/course.service";
import { sectionService } from "@/services/section.service";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ApiError } from "@/services/api";
import type { PageResponse } from "@/types/api";
import type { SectionResponseDto } from "@/types/section";

export default function CourseSectionsPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedSection, setSelectedSection] = useState<{
    id: string;
    title: string;
    description?: string;
  } | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");

  const [orderedSections, setOrderedSections] = useState<SectionResponseDto[]>([]);

  const { data: course } = useQuery({
    queryKey: ["admin-course", courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: !!courseId,
  });

  const courseTitle = course?.title?.trim() || "Course";

  const { data: sectionsPage, isLoading: isSectionsLoading } = useQuery({
    queryKey: ["admin-sections", courseId],
    queryFn: () => sectionService.getSections({ courseId, size: 100 }),
    enabled: !!courseId,
  });

  const sections = useMemo(() => sectionsPage?.content ?? [], [sectionsPage]);

  useEffect(() => {
    setOrderedSections((prev) => {
      if (prev.length === 0) return sections;

      const sameIds =
        prev.length === sections.length &&
        sections.every((sec) => prev.some((item) => item.id === sec.id));

      if (!sameIds) return sections;

      const matchesServerOrder = prev.every((sec, index) => sec.id === sections[index]?.id);
      if (matchesServerOrder) return sections;

      return prev.map((local) => sections.find((sec) => sec.id === local.id) ?? local);
    });
  }, [sections]);

  const isOrderDirty = useMemo(() => {
    if (sections.length < 2 || orderedSections.length !== sections.length) return false;
    return orderedSections.some((sec, index) => sec.id !== sections[index]?.id);
  }, [orderedSections, sections]);

  const isSearching = debouncedSearchQuery.trim().length > 0;

  const filteredSections = useMemo(() => {
    if (!isSearching) return orderedSections;
    return orderedSections.filter((sec) =>
      sec.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [orderedSections, debouncedSearchQuery, isSearching]);

  const createMutation = useMutation({
    mutationFn: (data: { courseId: string; title: string; description?: string }) =>
      sectionService.createSection(data),
    onSuccess: () => {
      addToast({ type: "success", message: "Section created successfully!" });
      void queryClient.invalidateQueries({ queryKey: ["admin-sections", courseId] });
      setIsAddOpen(false);
      setTitleInput("");
      setDescriptionInput("");
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "An error occurred while creating the section.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { sectionId: string; title: string; description?: string }) =>
      sectionService.updateSection(data.sectionId, {
        title: data.title,
        description: data.description,
      }),
    onSuccess: () => {
      addToast({ type: "success", message: "Section updated successfully!" });
      void queryClient.invalidateQueries({ queryKey: ["admin-sections", courseId] });
      setIsEditOpen(false);
      setSelectedSection(null);
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "An error occurred while updating the section.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sectionId: string) => sectionService.deleteSection(sectionId),
    onSuccess: () => {
      addToast({ type: "success", message: "Section deleted successfully!" });
      void queryClient.invalidateQueries({ queryKey: ["admin-sections", courseId] });
      setIsDeleteOpen(false);
      setSelectedSection(null);
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "Unable to delete this section.",
      });
      setIsDeleteOpen(false);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (sectionIds: string[]) =>
      sectionService.reorderSections(courseId, { sectionIds }),
    onSuccess: async (_data, sectionIds) => {
      addToast({ type: "success", message: "Section order saved!" });
      queryClient.setQueryData<PageResponse<SectionResponseDto>>(
        ["admin-sections", courseId],
        (old) => {
          if (!old) return old;
          const byId = new Map(old.content.map((sec) => [sec.id, sec]));
          return {
            ...old,
            content: sectionIds.flatMap((id, index) => {
              const sec = byId.get(id);
              return sec ? [{ ...sec, sortOrder: index + 1 }] : [];
            }),
          };
        }
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-sections", courseId] });
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "Unable to save section order.",
      });
    },
  });

  const handleReorder = (activeId: string, overId: string) => {
    setOrderedSections((items) => {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === overId);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleDiscardReorder = () => {
    setOrderedSections(sections);
  };

  const handleSubmitReorder = async () => {
    if (orderedSections.length < 2) {
      addToast({
        type: "warning",
        message: "At least 2 sections are required to reorder.",
      });
      return;
    }
    await reorderMutation.mutateAsync(orderedSections.map((sec) => sec.id));
  };

  const handleOpenAdd = () => {
    setTitleInput("");
    setDescriptionInput("");
    setIsAddOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      addToast({ type: "warning", message: "Section title cannot be empty." });
      return;
    }
    createMutation.mutate({
      courseId,
      title: titleInput.trim(),
      description: descriptionInput.trim() || undefined,
    });
  };

  const handleOpenEdit = (sec: SectionResponseDto) => {
    setSelectedSection({ id: sec.id, title: sec.title, description: sec.description });
    setTitleInput(sec.title);
    setDescriptionInput(sec.description || "");
    setIsEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection) return;
    if (!titleInput.trim()) {
      addToast({ type: "warning", message: "Section title cannot be empty." });
      return;
    }
    updateMutation.mutate({
      sectionId: selectedSection.id,
      title: titleInput.trim(),
      description: descriptionInput.trim() || undefined,
    });
  };

  const handleOpenDelete = (sec: SectionResponseDto) => {
    setSelectedSection({ id: sec.id, title: sec.title });
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!selectedSection) return;
    deleteMutation.mutate(selectedSection.id);
  };

  const columns: AdminTableColumn<SectionResponseDto>[] = [
    {
      key: "title",
      header: "Section",
      cellClassName: "whitespace-normal px-5 py-3 align-middle font-semibold text-stone-900",
      cell: (sec) => sec.title,
    },
    {
      key: "description",
      header: "Description",
      cellClassName: "max-w-sm truncate px-5 py-3 align-middle text-xs text-stone-500",
      cell: (sec) => sec.description || "No detailed description yet.",
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-28 px-3 text-center",
      cellClassName: "w-28 px-3 py-3 text-center align-middle",
      overlayCell: () => (
        <span className="inline-flex h-8 w-8 items-center justify-center text-stone-300">
          <MoreVertical className="h-4 w-4" />
        </span>
      ),
      cell: (sec) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-gray-100 focus:outline-none">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-38">
            <DropdownMenuItem className="cursor-pointer p-0">
              <Link
                href={`/admin/sections/${sec.id}/lessons?courseId=${courseId}`}
                className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium"
              >
                <BookOpen className="h-4 w-4" />
                Manage lessons
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleOpenEdit(sec)}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleOpenDelete(sec)}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title={courseTitle} showSearch={false} />

      <div className="p-6 space-y-6">
        <AdminBreadcrumb
          items={[
            { label: "Courses", href: "/admin/courses" },
            { label: courseTitle },
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-850">{courseTitle}</h2>
            <p className="text-sm text-stone-500 mt-1">
              Drag and drop to reorder sections, then save to apply the new order
            </p>
          </div>
          <Button
            onClick={handleOpenAdd}
            leftIcon={<Plus className="h-4 w-4" />}
            className="md:w-auto w-full"
          >
            Add Section
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <AdminSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search sections..."
          />
        </div>

        <ReorderDirtyBar
          visible={isOrderDirty}
          message="Section order will be updated for all students. Are you sure you want to save this change?"
          isSubmitting={reorderMutation.isPending}
          onSubmit={handleSubmitReorder}
          onDiscard={handleDiscardReorder}
        />

        {isSearching && orderedSections.length > 1 && (
          <p className="text-xs text-stone-500">
            Searching — drag and drop is temporarily disabled. Clear the keyword to reorder.
          </p>
        )}

        {isSectionsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse p-5 border border-stone-200 bg-stone-50/50 rounded-xl h-36 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-2/3"></div>
                  <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-stone-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        )}

        {!isSectionsLoading && sections.length === 0 && (
          <div className="text-center py-16 border border-dashed border-stone-300 rounded-xl bg-stone-50/50 max-w-xl mx-auto">
            <FolderOpen className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-4 text-lg font-bold text-stone-800">No sections yet</h3>
            <p className="mt-2 text-sm text-stone-400 max-w-xs mx-auto">
              Create the first section to organize lessons for this course.
            </p>
            <Button
              onClick={handleOpenAdd}
              leftIcon={<Plus className="h-4 w-4" />}
              className="mt-6 h-9 text-xs"
            >
              Add Section
            </Button>
          </div>
        )}

        {!isSectionsLoading && orderedSections.length > 0 && (
          <AdminTable
            columns={columns}
            data={filteredSections}
            getRowId={(sec) => sec.id}
            enableReorder
            reorderDisabled={isSearching}
            onReorder={handleReorder}
            emptyMessage="No sections match your search."
          />
        )}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-stone-200 bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-stone-850">Add new section</h3>
            <p className="text-xs text-stone-400 mt-1">
              Enter the required information to create a new section in this course.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <AdminInput
                label="Section title"
                placeholder="Enter section title..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                required
              />

              <Textarea
                label="Section description"
                placeholder="Enter a short description for this section..."
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                rows={3}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="h-9 py-1 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending}
                  className="h-9 py-1 px-3 text-xs"
                >
                  Create section
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-stone-200 bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-stone-850">Edit section</h3>
            <p className="text-xs text-stone-400 mt-1">Update the section title.</p>

            <form onSubmit={handleUpdate} className="space-y-4 mt-4">
              <AdminInput
                label="Section title"
                placeholder="Enter section title..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                required
              />

              <Textarea
                label="Section description"
                placeholder="Enter a short description for this section..."
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                rows={3}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="h-9 py-1 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={updateMutation.isPending}
                  className="h-9 py-1 px-3 text-xs"
                >
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={isDeleteOpen && !!selectedSection}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setSelectedSection(null);
        }}
        title="Delete section?"
        description={
          <>
            {selectedSection?.title} will be permanently deleted along with all lessons inside. This action
            cannot be undone.
          </>
        }
        confirmLabel="Delete section"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
