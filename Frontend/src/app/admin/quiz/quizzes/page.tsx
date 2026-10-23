"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminBreadcrumb, AdminHeader } from "@/components/layout/admin-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FilterSelect } from "@/components/ui/select";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { AdminTablePagination } from "@/components/admin/admin-table-pagination";
import { AdminModal } from "@/components/admin/quiz/admin-modal";
import { ConfirmDialog } from "@/components/admin/quiz/confirm-dialog";
import { ROUTES } from "@/constants/routes";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { quizAdminService } from "@/services/quiz-admin.service";
import type { ApiError } from "@/services/api";
import type { AdminQuizResponseDto, AdminTopicResponseDto } from "@/types/quiz-admin";
import { useToast } from "@/components/ui/toast";
import {
  BookOpen,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { QUIZ_PASS_PERCENT } from "@/lib/quiz-scoring";

const PAGE_SIZE = 10;

type QuizDraft = {
  topicId: string;
  title: string;
  description: string;
  duration: string;
  isPublished: boolean;
};

function trimOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  return (error as ApiError)?.message || fallback;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export default function AdminQuizQuizzesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 1000);
  const [topicFilter, setTopicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<AdminQuizResponseDto | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<AdminQuizResponseDto | null>(null);
  const [draft, setDraft] = useState<QuizDraft>({
    topicId: "",
    title: "",
    description: "",
    duration: "30",
    isPublished: false,
  });
  const searchParam = trimOrUndefined(debouncedSearch);
  const topicId = topicFilter || undefined;
  const isPublished =
    statusFilter === "all" ? undefined : statusFilter === "published";

  const topicsQuery = useQuery({
    queryKey: ["admin-quiz-topics-options"],
    queryFn: () => quizAdminService.getTopics({ size: 1000 }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const quizzesQuery = useQuery({
    queryKey: ["admin-quiz-quizzes", { page, search: searchParam, topicId, isPublished }],
    queryFn: () =>
      quizAdminService.getQuizzes({
        page,
        size: PAGE_SIZE,
        search: searchParam,
        topicId,
        isPublished,
      }),
    staleTime: 0,
    refetchOnMount: "always",
    placeholderData: (prev) => prev,
  });

  const questionsQuery = useQuery({
    queryKey: ["admin-quiz-questions-count"],
    queryFn: () => quizAdminService.getQuestions({ size: 1000 }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const topics = topicsQuery.data?.content ?? [];
  const pageQuizzes = quizzesQuery.data?.content ?? [];
  const questions = questionsQuery.data?.content ?? [];

  const topicOptions = useMemo(
    () => topics.map((topic) => ({ value: topic.id, label: topic.name })),
    [topics]
  );

  const questionCountByQuiz = useMemo(() => {
    return questions.reduce<Record<string, number>>((acc, question) => {
      acc[question.quizId] = (acc[question.quizId] ?? 0) + 1;
      return acc;
    }, {});
  }, [questions]);

  const totalQuizzes = quizzesQuery.data?.totalElements ?? 0;
  const totalPages = Math.max(quizzesQuery.data?.totalPages ?? 1, 1);
  const safePage = Math.min(page, totalPages - 1);

  const clearFilters = () => {
    setSearch("");
    setTopicFilter("");
    setStatusFilter("all");
    setPage(0);
  };

  const openCreate = () => {
    setEditingQuiz(null);
    setDraft({
      topicId: topics[0]?.id ?? "",
      title: "",
      description: "",
      duration: "30",
      isPublished: false,
    });
    setIsFormOpen(true);
  };

  const openEdit = (quiz: AdminQuizResponseDto) => {
    setEditingQuiz(quiz);
    setDraft({
      topicId: quiz.topicId,
      title: quiz.title,
      description: quiz.description ?? "",
      duration: quiz.duration?.toString() ?? "30",
      isPublished: quiz.isPublished,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingQuiz(null);
    setDraft({
      topicId: topics[0]?.id ?? "",
      title: "",
      description: "",
      duration: "30",
      isPublished: false,
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof quizAdminService.createQuiz>[0]) => quizAdminService.createQuiz(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-quizzes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions-count"] });
      addToast({ type: "success", message: "Quiz created." });
      closeForm();
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to create quiz.") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ quizId, data }: { quizId: string; data: Parameters<typeof quizAdminService.updateQuiz>[1] }) =>
      quizAdminService.updateQuiz(quizId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-quizzes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions-count"] });
      addToast({ type: "success", message: "Quiz updated." });
      closeForm();
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to update quiz.") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (quizId: string) => quizAdminService.deleteQuiz(quizId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-quizzes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-questions-count"] });
      addToast({ type: "success", message: "Quiz deleted." });
      setIsDeleteOpen(false);
      setDeletingQuiz(null);
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to delete quiz.") });
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ quizId, isPublished }: { quizId: string; isPublished: boolean }) =>
      isPublished ? quizAdminService.unpublishQuiz(quizId) : quizAdminService.publishQuiz(quizId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-quizzes"] });
      addToast({ type: "success", message: "Publish status updated." });
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to change status.") });
    },
  });

  const handleSubmit = () => {
    const topicId = draft.topicId.trim();
    const title = draft.title.trim();
    const description = draft.description.trim();
    const duration = toNumber(draft.duration);

    if (!topicId) {
      addToast({ type: "warning", message: "Please select a topic." });
      return;
    }
    if (!title) {
      addToast({ type: "warning", message: "Quiz title cannot be empty." });
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      addToast({ type: "warning", message: "Duration must be greater than 0." });
      return;
    }

    if (editingQuiz) {
      updateMutation.mutate({
        quizId: editingQuiz.id,
        data: {
          topicId,
          title,
          description: description || null,
          duration,
          isPublished: draft.isPublished,
        },
      });
      return;
    }

    createMutation.mutate({
      topicId,
      title,
      description: description || null,
      duration,
      isPublished: draft.isPublished,
    });
  };

  const handleDelete = () => {
    if (!deletingQuiz) return;
    deleteMutation.mutate(deletingQuiz.id);
  };

  const visibleStart = totalQuizzes === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const visibleEnd = Math.min((safePage + 1) * PAGE_SIZE, totalQuizzes);

  const columns: AdminTableColumn<AdminQuizResponseDto>[] = [
    {
      key: "title",
      header: "Title",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "whitespace-normal px-4 py-3 align-middle",
      cell: (quiz) => (
        <div className="flex flex-col">
          <span className="font-semibold text-stone-800">{quiz.title}</span>
          <span className="mt-0.5 line-clamp-2 text-xs text-stone-500">
            {quiz.description?.trim() || "No description yet"}
          </span>
        </div>
      ),
    },
    {
      key: "topic",
      header: "Topic",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (quiz) => quiz.topicName,
    },
    {
      key: "duration",
      header: "Duration",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (quiz) => (quiz.duration ? `${quiz.duration} min` : "—"),
    },
    {
      key: "passScore",
      header: "Passing score",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: () => `${QUIZ_PASS_PERCENT}%`,
    },
    {
      key: "questionCount",
      header: "Question count",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (quiz) => questionCountByQuiz[quiz.id] ?? 0,
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle",
      cell: (quiz) => (
        <Badge variant={quiz.isPublished ? "success" : "warning"} dot>
          {quiz.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created on",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (quiz) => formatDate(quiz.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-16 px-4 py-3 text-center uppercase",
      cellClassName: "w-16 px-4 py-3 text-center align-middle",
      cell: (quiz) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-gray-100 focus:outline-none">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem className="cursor-pointer p-0">
              <Link
                href={ROUTES.ADMIN_QUIZ_QUESTIONS(quiz.id)}
                className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium"
              >
                <BookOpen className="h-4 w-4" />
                Manage questions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer p-0">
              <Link
                href={ROUTES.ADMIN_QUIZ_PREVIEW(quiz.id)}
                className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer p-0" onClick={() => openEdit(quiz)}>
              <span className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium">
                <Pencil className="h-4 w-4" />
                Edit
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer p-0"
              onClick={() =>
                publishMutation.mutate({
                  quizId: quiz.id,
                  isPublished: quiz.isPublished,
                })
              }
            >
              <span className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium">
                <Settings2 className="h-4 w-4" />
                {quiz.isPublished ? "Unpublish" : "Publish"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer p-0"
              onClick={() => {
                setDeletingQuiz(quiz);
                setIsDeleteOpen(true);
              }}
            >
              <span className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium">
                <Trash2 className="h-4 w-4" />
                Delete
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title="Quiz management" showSearch={false} />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
        <AdminBreadcrumb
          items={[
            { label: "Admin", href: ROUTES.ADMIN },
            { label: "Practice" },
            { label: "Quizzes" },
          ]}
        />

        {quizzesQuery.isError ? (
          <Alert type="error" message={getErrorMessage(quizzesQuery.error, "Failed to load quizzes.")} />
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <AdminSearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(0);
            }}
            placeholder="Search title, description..."
          />
          <FilterSelect
            value={topicFilter}
            onChange={(value) => {
              setTopicFilter(value);
              setPage(0);
            }}
            options={topicOptions}
            placeholder="Topic"
            className="min-w-[160px]"
          />
          <FilterSelect
            value={statusFilter === "all" ? "" : statusFilter}
            onChange={(value) => {
              setStatusFilter(value === "" ? "all" : (value as typeof statusFilter));
              setPage(0);
            }}
            options={[
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
            placeholder="Status"
            searchable={false}
            className="min-w-[140px]"
          />
          <Button variant="outline" className="h-9" onClick={clearFilters}>
            Clear filters
          </Button>
          <div className="flex-1" />
          <Button className="h-9 shrink-0" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Create new
          </Button>
        </div>

        <AdminTable
          columns={columns}
          data={pageQuizzes}
          getRowId={(quiz) => quiz.id}
          isLoading={quizzesQuery.isLoading}
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
                  No matching quizzes found.
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Try clearing filters or create a new quiz.
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
              summary={`Showing ${visibleStart}-${visibleEnd} of ${totalQuizzes} quizzes`}
            />
          }
        />
      </div>

      <AdminModal
        open={isFormOpen}
        title={editingQuiz ? "Edit quiz" : "Create quiz"}
        description="Set up general quiz information."
        onClose={closeForm}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FilterSelect
            value={draft.topicId}
            onChange={(value) => setDraft((current) => ({ ...current, topicId: value }))}
            options={topicOptions}
            placeholder="Select topic"
          />
          <Input
            label="Title"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Enter title"
          />
          <Textarea
            label="Description"
            rows={4}
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            placeholder="Enter description"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Duration (minutes)"
              type="number"
              min={1}
              value={draft.duration}
              onChange={(event) => setDraft((current) => ({ ...current, duration: event.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-stone-700">Passing score</span>
              <div className="flex h-10 items-center rounded-lg border border-border bg-stone-50 px-3 text-sm text-stone-600">
                {QUIZ_PASS_PERCENT}% (fixed)
              </div>
            </div>
          </div>
          <Checkbox
            label="Publish immediately"
            checked={draft.isPublished}
            onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))}
          />
        </div>
      </AdminModal>

      <ConfirmDialog
        open={isDeleteOpen}
        title="Delete quiz"
        description={`Are you sure you want to delete the quiz "${deletingQuiz?.title ?? ""}"?`}
        confirmLabel="Confirm delete"
        loading={deleteMutation.isPending}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingQuiz(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
