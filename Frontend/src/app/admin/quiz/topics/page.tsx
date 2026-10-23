"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminBreadcrumb, AdminHeader } from "@/components/layout/admin-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { AdminTablePagination } from "@/components/admin/admin-table-pagination";
import { AdminModal } from "@/components/admin/quiz/admin-modal";
import { ConfirmDialog } from "@/components/admin/quiz/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { quizAdminService } from "@/services/quiz-admin.service";
import type { ApiError } from "@/services/api";
import type { AdminTopicResponseDto } from "@/types/quiz-admin";
import { useToast } from "@/components/ui/toast";
import { Plus, Pencil, Trash2, Search, MoreVertical } from "lucide-react";

const PAGE_SIZE = 10;

type TopicDraft = {
  name: string;
  description: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return (error as ApiError)?.message || fallback;
}

function trimOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export default function AdminQuizTopicsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 1000);
  const [page, setPage] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<AdminTopicResponseDto | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<AdminTopicResponseDto | null>(null);
  const [draft, setDraft] = useState<TopicDraft>({ name: "", description: "" });
  const [pageError, setPageError] = useState<string | null>(null);

  const searchParam = trimOrUndefined(debouncedSearch);

  const topicsQuery = useQuery({
    queryKey: ["admin-quiz-topics", { page, search: searchParam }],
    queryFn: () =>
      quizAdminService.getTopics({
        page,
        size: PAGE_SIZE,
        search: searchParam,
      }),
    staleTime: 0,
    refetchOnMount: "always",
    placeholderData: (prev) => prev,
  });

  const pageTopics = topicsQuery.data?.content ?? [];
  const totalTopics = topicsQuery.data?.totalElements ?? 0;
  const totalPages = Math.max(topicsQuery.data?.totalPages ?? 1, 1);
  const safePage = Math.min(page, totalPages - 1);

  const openCreate = () => {
    setEditingTopic(null);
    setDraft({ name: "", description: "" });
    setIsFormOpen(true);
  };

  const openEdit = (topic: AdminTopicResponseDto) => {
    setEditingTopic(topic);
    setDraft({
      name: topic.name,
      description: topic.description ?? "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTopic(null);
    setDraft({ name: "", description: "" });
  };

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string | null }) => quizAdminService.createTopic(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-topics"] });
      addToast({ type: "success", message: "Topic created." });
      closeForm();
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to create topic.") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ topicId, data }: { topicId: string; data: { name: string; description?: string | null } }) =>
      quizAdminService.updateTopic(topicId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-topics"] });
      addToast({ type: "success", message: "Topic updated." });
      closeForm();
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to update topic.") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (topicId: string) => quizAdminService.deleteTopic(topicId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-topics"] });
      addToast({ type: "success", message: "Topic deleted." });
      setIsDeleteOpen(false);
      setDeletingTopic(null);
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to delete topic.") });
    },
  });

  const handleSubmit = () => {
    const name = draft.name.trim();
    const description = draft.description.trim();

    if (!name) {
      addToast({ type: "warning", message: "Topic name cannot be empty." });
      return;
    }

    if (editingTopic) {
      updateMutation.mutate({
        topicId: editingTopic.id,
        data: {
          name,
          description: description || null,
        },
      });
      return;
    }

    createMutation.mutate({
      name,
      description: description || null,
    });
  };

  const handleDelete = () => {
    if (!deletingTopic) return;
    deleteMutation.mutate(deletingTopic.id);
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;
  const visibleStart = totalTopics === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const visibleEnd = Math.min((safePage + 1) * PAGE_SIZE, totalTopics);

  const columns: AdminTableColumn<AdminTopicResponseDto>[] = [
    {
      key: "name",
      header: "Topic name",
      headerClassName: "px-5 py-3 uppercase",
      cellClassName: "whitespace-normal px-5 py-4 align-middle font-semibold text-stone-800",
      cell: (topic) => topic.name,
    },
    {
      key: "description",
      header: "Description",
      headerClassName: "px-5 py-3 uppercase",
      cellClassName: "px-5 py-4 align-middle text-stone-600",
      cell: (topic) => (
        <span className="line-clamp-2">{topic.description?.trim() || "No description yet"}</span>
      ),
    },
    {
      key: "quizCount",
      header: "Quiz count",
      headerClassName: "px-5 py-3 uppercase",
      cellClassName: "px-5 py-4 align-middle text-stone-600",
      cell: (topic) => topic.quizCount ?? 0,
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-16 px-5 py-3 text-center uppercase",
      cellClassName: "w-16 px-5 py-2.5 text-center align-middle",
      cell: (topic) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-gray-100 focus:outline-none">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-38">
            <DropdownMenuItem
              className="flex items-center gap-2 text-sm cursor-pointer"
              onClick={() => openEdit(topic)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setDeletingTopic(topic);
                setIsDeleteOpen(true);
              }}
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
      <AdminHeader title="Topic management" showSearch={false} />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
        <AdminBreadcrumb
          items={[
            { label: "Admin", href: ROUTES.ADMIN },
            { label: "Practice" },
            { label: "Topic" },
          ]}
        />

        {pageError ? <Alert type="error" message={pageError} /> : null}
        {topicsQuery.isError ? (
          <Alert
            type="error"
            message={getErrorMessage(topicsQuery.error, "Failed to load topics.")}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <AdminSearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            placeholder="Search topics..."
          />
          <div className="flex-1" />
          <Button className="h-9 shrink-0" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add topic
          </Button>
        </div>

        <AdminTable
          columns={columns}
          data={pageTopics}
          getRowId={(topic) => topic.id}
          isLoading={topicsQuery.isLoading}
          skeletonRows={4}
          cardClassName="border-[#e8e4df]"
          headerRowClassName="border-[#e8e4df] bg-[#faf8f6] hover:bg-[#faf8f6]"
          rowClassName="border-[#e8e4df] hover:bg-[#faf8f6]/60"
          emptyMessage={
            <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f2ef] text-stone-400">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">
                  No topics match the current filters.
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Try clearing the search or create a new topic to get started.
                </p>
              </div>
              <Button variant="outline" onClick={openCreate}>
                Create new
              </Button>
            </div>
          }
          footer={
            <AdminTablePagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              className="border-[#e8e4df]"
              summary={`Showing ${visibleStart}-${visibleEnd} of ${totalTopics} topics`}
            />
          }
        />
      </div>

      <AdminModal
        open={isFormOpen}
        title={editingTopic ? "Edit topic" : "Add new topic"}
        description="Manage practice topic details."
        onClose={closeForm}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} isLoading={isBusy}>
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Topic name"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Enter topic name"
          />
          <Textarea
            label="Description"
            rows={4}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            placeholder="Enter topic description"
          />
        </div>
      </AdminModal>

      <ConfirmDialog
        open={isDeleteOpen}
        title="Delete topic"
        description={`Are you sure you want to delete the topic "${deletingTopic?.name ?? ""}"?`}
        confirmLabel="Confirm delete"
        loading={deleteMutation.isPending}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingTopic(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
