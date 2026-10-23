"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AdminBreadcrumb, AdminHeader } from "@/components/layout/admin-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { quizAdminService } from "@/services/quiz-admin.service";
import type { ApiError } from "@/services/api";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft, ArrowRight, BookOpen, Eye, ListRestart } from "lucide-react";

function getErrorMessage(error: unknown, fallback: string) {
  return (error as ApiError)?.message || fallback;
}

function optionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

export default function AdminQuizPreviewPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params.quizId;
  const [currentIndex, setCurrentIndex] = useState(0);

  const quizQuery = useQuery({
    queryKey: ["admin-quiz-preview", quizId],
    queryFn: () => quizAdminService.getQuizById(quizId),
    enabled: Boolean(quizId),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const quiz = quizQuery.data;
  const questions = quiz?.questions ?? [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (currentIndex >= questions.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, questions.length]);

  const correctOptionId = useMemo(() => {
    if (!currentQuestion) return null;
    return currentQuestion.options.find((option) => option.isCorrect)?.id ?? null;
  }, [currentQuestion]);

  return (
    <>
      <AdminHeader
        title="Quiz preview"
        showSearch={false}
        actions={
          <Link href={ROUTES.ADMIN_QUIZ_QUESTIONS(quizId)}>
            <Button variant="outline" leftIcon={<BookOpen className="h-4 w-4" />}>
              Manage questions
            </Button>
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
        <AdminBreadcrumb
          items={[
            { label: "Admin", href: ROUTES.ADMIN },
            { label: "Practice", href: ROUTES.ADMIN_QUIZ_TOPICS },
            { label: "Quizzes", href: ROUTES.ADMIN_QUIZ_QUIZZES },
            { label: quiz?.title || "Preview" },
          ]}
        />

        {quizQuery.isError ? (
          <Alert type="error" message={getErrorMessage(quizQuery.error, "Failed to load quiz for preview.")} />
        ) : null}

        <section className="rounded-[1.5rem] border border-[#e8e4df] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Preview</p>
              <h2 className="mt-1 text-2xl font-bold text-stone-850">{quiz?.title || "Loading..."}</h2>
              <p className="mt-1 max-w-3xl text-sm text-stone-500">
                {quiz?.description?.trim() || "Admin preview interface."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={quiz?.isPublished ? "success" : "warning"} dot>
                {quiz?.isPublished ? "Published" : "Draft"}
              </Badge>
              <Badge variant="info" dot>
                {questions.length} questions
              </Badge>
              <Badge variant="purple" dot>
                {quiz?.duration ? `${quiz.duration} min` : "Unlimited"}
              </Badge>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="border border-[#e8e4df]" padding="none">
            <div className="border-b border-[#e8e4df] px-4 py-3">
              <CardTitle className="text-sm">Question list</CardTitle>
            </div>
            <div className="space-y-2 p-3">
              {questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#e8e4df] bg-[#faf8f6] px-4 py-8 text-center text-sm text-stone-500">
                  No questions yet.
                </div>
              ) : (
                questions.map((question, index) => {
                  const active = index === currentIndex;

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-[#b01c24] bg-red-50 text-stone-900"
                          : "border-[#e8e4df] bg-white text-stone-600 hover:bg-[#faf8f6]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">Question {index + 1}</span>
                        <span className="text-xs text-stone-400">{question.options.length} answers</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">{question.content}</p>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="border border-[#e8e4df]" padding="none">
            <div className="flex items-center justify-between gap-3 border-b border-[#e8e4df] px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Current question</p>
                <h3 className="mt-1 text-lg font-semibold text-stone-850">
                  {currentQuestion ? `Question ${currentIndex + 1}` : "No data yet"}
                </h3>
              </div>
              <Badge variant="info" dot>
                {currentQuestion?.options.length ?? 0} answers
              </Badge>
            </div>

            {currentQuestion ? (
              <div className="space-y-6 p-5">
                <div className="rounded-2xl border border-[#e8e4df] bg-[#faf8f6] p-5">
                  <p className="text-base font-semibold leading-8 text-stone-800">{currentQuestion.content}</p>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = option.id === correctOptionId;

                    return (
                      <div
                        key={option.id}
                        className={`rounded-2xl border px-4 py-4 ${
                          isCorrect ? "border-emerald-200 bg-emerald-50" : "border-[#e8e4df] bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-[#f4f2ef] text-stone-700"
                            }`}
                          >
                            {optionLabel(index)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-stone-800">{option.content}</p>
                              {isCorrect ? <Badge variant="success">Correct answer</Badge> : null}
                            </div>
                            {currentQuestion.explanation && isCorrect ? (
                              <p className="mt-2 text-sm leading-6 text-stone-600">{currentQuestion.explanation}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[#e8e4df] pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      leftIcon={<ListRestart className="h-4 w-4" />}
                      onClick={() => setCurrentIndex(0)}
                    >
                      Back to start
                    </Button>
                    <Button
                      type="button"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      disabled={currentIndex >= questions.length - 1}
                      onClick={() => setCurrentIndex((current) => Math.min(current + 1, questions.length - 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-stone-500">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f2ef] text-stone-400">
                    <Eye className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-stone-700">No questions to preview.</p>
                  <p className="text-xs text-stone-400">
                    Go back to the management page and add questions to this quiz.
                  </p>
                  <Link href={ROUTES.ADMIN_QUIZ_QUESTIONS(quizId)}>
                    <Button variant="outline">Manage questions</Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
