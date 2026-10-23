"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminBreadcrumb, AdminHeader } from "@/components/layout/admin-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { AdminModal } from "@/components/admin/quiz/admin-modal";
import { ConfirmDialog } from "@/components/admin/quiz/confirm-dialog";
import { ROUTES } from "@/constants/routes";
import { quizAdminService } from "@/services/quiz-admin.service";
import type { ApiError } from "@/services/api";
import type { AdminQuizDetailResponseDto } from "@/types/quiz-admin";
import { useToast } from "@/components/ui/toast";
import {
  Copy,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QUIZ_PASS_PERCENT } from "@/lib/quiz-scoring";

type OptionDraft = {
  tempId: string;
  id?: string;
  content: string;
  isCorrect: boolean;
  removed?: boolean;
};

type QuestionDraft = {
  content: string;
  explanation: string;
  options: OptionDraft[];
};

type QuizQuestion = AdminQuizDetailResponseDto["questions"][number];

const initialOptions = (): OptionDraft[] => [
  { tempId: crypto.randomUUID(), content: "", isCorrect: true },
  { tempId: crypto.randomUUID(), content: "", isCorrect: false },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getErrorMessage(error: unknown, fallback: string) {
  return (error as ApiError)?.message || fallback;
}

function buildQuestionDraft(question?: QuizQuestion): QuestionDraft {
  if (!question) {
    return {
      content: "",
      explanation: "",
      options: initialOptions(),
    };
  }

  return {
    content: question.content,
    explanation: question.explanation ?? "",
    options:
      question.options.length > 0
        ? question.options.map((option, index) => ({
            tempId: `${question.id}-${option.id ?? index}`,
            id: option.id,
            content: option.content,
            isCorrect: option.isCorrect,
          }))
        : initialOptions(),
  };
}

function optionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

export default function AdminQuizQuestionsPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId;
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<QuizQuestion | null>(null);
  const [draft, setDraft] = useState<QuestionDraft>(buildQuestionDraft());
  const quizQuery = useQuery({
    queryKey: ["admin-quiz-detail", quizId],
    queryFn: () => quizAdminService.getQuizById(quizId),
    enabled: Boolean(quizId),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const quiz = quizQuery.data;
  const questions = quiz?.questions ?? [];

  const filteredQuestions = useMemo(() => {
    const query = normalize(search);
    if (!query) return questions;

    return questions.filter((question) =>
      [question.content, question.explanation]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [questions, search]);

  const openCreate = () => {
    setEditingQuestion(null);
    setDraft(buildQuestionDraft());
    setIsFormOpen(true);
  };

  const openEdit = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setDraft(buildQuestionDraft(question));
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
    setDraft(buildQuestionDraft());
  };

  const syncOptions = async (questionId: string, optionDrafts: OptionDraft[]) => {
    const activeOptions = optionDrafts.filter((option) => !option.removed);

    const updateTasks = activeOptions
      .filter((option) => option.id)
      .map((option) =>
        quizAdminService.updateOption(option.id!, {
          questionId,
          content: option.content.trim(),
          isCorrect: option.isCorrect,
        })
      );

    const createTasks = activeOptions
      .filter((option) => !option.id)
      .map((option) =>
        quizAdminService.createOption({
          questionId,
          content: option.content.trim(),
          isCorrect: option.isCorrect,
        })
      );

    const deleteTasks = optionDrafts
      .filter((option) => option.id && option.removed)
      .map((option) => quizAdminService.deleteOption(option.id!));

    await Promise.all([...updateTasks, ...createTasks, ...deleteTasks]);
  };

  const createMutation = useMutation({
    mutationFn: async (payload: { quizId: string; data: QuestionDraft }) => {
      const createdQuestion = await quizAdminService.createQuestion({
        quizId: payload.quizId,
        content: payload.data.content.trim(),
        explanation: payload.data.explanation.trim() || null,
      });

      await syncOptions(createdQuestion.id, payload.data.options);
      return createdQuestion;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-detail", quizId] });
      addToast({ type: "success", message: "Question added." });
      closeForm();
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to create question.") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { questionId: string; data: QuestionDraft }) => {
      await quizAdminService.updateQuestion(payload.questionId, {
        quizId,
        content: payload.data.content.trim(),
        explanation: payload.data.explanation.trim() || null,
      });

      await syncOptions(payload.questionId, payload.data.options);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-detail", quizId] });
      addToast({ type: "success", message: "Question updated." });
      closeForm();
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to update question.") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => quizAdminService.deleteQuestion(questionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-detail", quizId] });
      addToast({ type: "success", message: "Question deleted." });
      setIsDeleteOpen(false);
      setDeletingQuestion(null);
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to delete question.") });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (question: QuizQuestion) => {
      const createdQuestion = await quizAdminService.createQuestion({
        quizId,
        content: `${question.content} (Copy)`,
        explanation: question.explanation ?? null,
      });

      await Promise.all(
        question.options.map((option) =>
          quizAdminService.createOption({
            questionId: createdQuestion.id,
            content: option.content,
            isCorrect: option.isCorrect,
          })
        )
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-quiz-detail", quizId] });
      addToast({ type: "success", message: "Question duplicated." });
    },
    onError: (error) => {
      addToast({ type: "error", message: getErrorMessage(error, "Failed to duplicate question.") });
    },
  });

  const handleSubmit = () => {
    const content = draft.content.trim();
    const explanation = draft.explanation.trim();
    const activeOptions = draft.options.filter((option) => !option.removed);

    if (!content) {
      addToast({ type: "warning", message: "Question content cannot be empty." });
      return;
    }
    if (activeOptions.length < 2) {
      addToast({ type: "warning", message: "At least 2 answers are required." });
      return;
    }
    if (activeOptions.some((option) => !option.content.trim())) {
      addToast({ type: "warning", message: "Each answer must have content." });
      return;
    }
    if (activeOptions.filter((option) => option.isCorrect).length !== 1) {
      addToast({ type: "warning", message: "Only one correct answer is allowed." });
      return;
    }

    const payload = {
      content,
      explanation,
      options: activeOptions,
    };

    if (editingQuestion) {
      updateMutation.mutate({
        questionId: editingQuestion.id,
        data: payload,
      });
      return;
    }

    createMutation.mutate({
      quizId,
      data: payload,
    });
  };

  const handleDelete = () => {
    if (!deletingQuestion) return;
    deleteMutation.mutate(deletingQuestion.id);
  };

  const markCorrect = (tempId: string) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option) => ({
        ...option,
        isCorrect: option.tempId === tempId,
      })),
    }));
  };

  const addOption = () => {
    setDraft((current) => ({
      ...current,
      options: [...current.options.filter((option) => !option.removed), { tempId: crypto.randomUUID(), content: "", isCorrect: false }],
    }));
  };

  const removeOption = (tempId: string) => {
    setDraft((current) => {
      const activeCount = current.options.filter((option) => !option.removed).length;
      if (activeCount <= 2) return current;

      const nextOptions = current.options.map((option) =>
        option.tempId === tempId ? { ...option, removed: true } : option
      );
      const remainingActive = nextOptions.filter((option) => !option.removed);

      if (remainingActive.length > 0 && remainingActive.every((option) => !option.isCorrect)) {
        const [firstOption, ...rest] = remainingActive;
        firstOption.isCorrect = true;
        return {
          ...current,
          options: nextOptions.map((option) =>
            option.tempId === firstOption.tempId
              ? { ...option, isCorrect: true }
              : rest.some((item) => item.tempId === option.tempId)
                ? { ...option, isCorrect: false }
                : option
          ),
        };
      }

      return { ...current, options: nextOptions };
    });
  };

  const updateOptionContent = (tempId: string, content: string) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option) => (option.tempId === tempId ? { ...option, content } : option)),
    }));
  };

  const columns: AdminTableColumn<QuizQuestion>[] = [
    {
      key: "index",
      header: "No.",
      headerClassName: "w-20 px-4 py-3 uppercase",
      cellClassName: "w-20 px-4 py-3 align-middle text-stone-500",
      cell: (_question, index) => index + 1,
    },
    {
      key: "content",
      header: "Question content",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "whitespace-normal px-4 py-3 align-middle",
      cell: (question) => (
        <div className="flex flex-col">
          <span className="font-semibold text-stone-800">{question.content}</span>
          {question.explanation ? (
            <span className="mt-1 line-clamp-2 text-xs text-stone-500">{question.explanation}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "optionCount",
      header: "Answers",
      headerClassName: "px-4 py-3 uppercase",
      cellClassName: "px-4 py-3 align-middle text-stone-600",
      cell: (question) => (
        <Badge variant="info" dot>
          {question.options.length}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "w-16 px-4 py-3 text-center uppercase",
      cellClassName: "w-16 px-4 py-3 text-center align-middle",
      cell: (question) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-gray-100 focus:outline-none">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem className="cursor-pointer p-0" onClick={() => openEdit(question)}>
              <span className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium">
                <Pencil className="h-4 w-4" />
                Edit
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer p-0"
              onClick={() => duplicateMutation.mutate(question)}
            >
              <span className="flex w-full items-center gap-2 px-1.5 py-1 text-sm font-medium">
                <Copy className="h-4 w-4" />
                Duplicate
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer p-0"
              onClick={() => {
                setDeletingQuestion(question);
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
      <AdminHeader
        title="Question management"
        showSearch={false}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add question
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
        <AdminBreadcrumb
          items={[
            { label: "Admin", href: ROUTES.ADMIN },
            { label: "Practice", href: ROUTES.ADMIN_QUIZ_TOPICS },
            { label: "Quizzes", href: ROUTES.ADMIN_QUIZ_QUIZZES },
            { label: quiz?.title || "Questions" },
          ]}
        />

        {quizQuery.isError ? (
          <Alert type="error" message={getErrorMessage(quizQuery.error, "Failed to load quiz.")} />
        ) : null}

        <section className="rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-stone-850">
                {quiz?.title || "Loading..."}
              </h2>
              <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">
                {quiz?.description?.trim() ||
                  "Manage the questions and answers for this quiz."}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link href={ROUTES.ADMIN_QUIZ_PREVIEW(quizId)}>
                <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                  Preview
                </Button>
              </Link>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Add question
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
            <span className="text-stone-500">
              Total questions{" "}
              <strong className="font-semibold text-stone-800">{questions.length}</strong>
            </span>
            <span className="hidden text-stone-300 sm:inline">·</span>
            <span className="text-stone-500">
              Filtered{" "}
              <strong className="font-semibold text-stone-800">
                {filteredQuestions.length}
              </strong>
            </span>
            <span className="hidden text-stone-300 sm:inline">·</span>
            <span className="text-stone-500">
              Passing score{" "}
              <strong className="font-semibold text-stone-800">
                {QUIZ_PASS_PERCENT}%
              </strong>
            </span>
            <span className="hidden text-stone-300 sm:inline">·</span>
            <span className="text-stone-500">
              Duration{" "}
              <strong className="font-semibold text-stone-800">
                {quiz?.duration ? `${quiz.duration} min` : "—"}
              </strong>
            </span>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#e8e4df] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#e8e4df] p-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-base">Question list</CardTitle>
              <p className="mt-1 text-xs text-stone-500">Search by content and explanation.</p>
            </div>

            <AdminSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search questions..."
            />
          </div>

          <AdminTable
            columns={columns}
            data={filteredQuestions}
            getRowId={(question) => question.id}
            isLoading={quizQuery.isLoading}
            skeletonRows={4}
            cardClassName="border-0 shadow-none"
            headerRowClassName="border-[#e8e4df] bg-[#faf8f6] hover:bg-[#faf8f6]"
            rowClassName="border-[#e8e4df] hover:bg-[#faf8f6]/60"
            emptyMessage={
              <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f2ef] text-stone-400">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-700">No matching questions.</p>
                  <p className="mt-1 text-xs text-stone-400">
                    Add the first question or clear the search filter.
                  </p>
                </div>
                <Button variant="outline" onClick={openCreate}>
                  Create new
                </Button>
              </div>
            }
          />
        </section>
      </div>

      <AdminModal
        open={isFormOpen}
        title={editingQuestion ? "Edit question" : "Add question"}
        description="Add question content and manage answers below."
        onClose={closeForm}
        className="max-w-4xl"
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
        <div className="space-y-5">
          <div className="grid gap-4">
            <Textarea
              label="Question content"
              rows={4}
              value={draft.content}
              onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
              placeholder="Enter question content"
            />
            <Textarea
              label="Explanation"
              rows={3}
              value={draft.explanation}
              onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))}
              placeholder="Explain the answer if needed"
            />
          </div>

          <div className="rounded-2xl border border-[#e8e4df] bg-[#faf8f6] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-stone-800">Answers</h4>
                <p className="mt-1 text-xs text-stone-500">At least 2 answers and only one correct answer.</p>
              </div>
              <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addOption}>
                Add answer
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {draft.options
                .filter((option) => !option.removed)
                .map((option, index) => (
                  <div key={option.tempId} className="rounded-xl border border-[#e8e4df] bg-white p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f4f2ef] text-xs font-bold text-stone-700">
                        {optionLabel(index)}
                      </div>
                      <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
                        <Input
                          value={option.content}
                          onChange={(event) => updateOptionContent(option.tempId, event.target.value)}
                          placeholder={`Answer ${optionLabel(index)}`}
                        />
                        <label className="inline-flex items-center gap-2 rounded-lg border border-[#e8e4df] px-3 py-2 text-xs font-medium text-stone-600">
                          <input
                            type="radio"
                            name="correct-answer"
                            checked={option.isCorrect}
                            onChange={() => markCorrect(option.tempId)}
                            className="h-4 w-4 accent-[#b01c24]"
                          />
                          Correct
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeOption(option.tempId)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>
      </AdminModal>

      <ConfirmDialog
        open={isDeleteOpen}
        title="Delete question"
        description={`Are you sure you want to delete the question "${deletingQuestion?.content ?? ""}"?`}
        confirmLabel="Confirm delete"
        loading={deleteMutation.isPending}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingQuestion(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
