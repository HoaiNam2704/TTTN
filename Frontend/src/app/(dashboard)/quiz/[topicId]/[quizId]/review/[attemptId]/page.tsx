"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { formatQuizDateTime } from "@/lib/quiz-flow";
import { calcQuizScorePercent, isQuizPassed } from "@/lib/quiz-scoring";
import { getQuizAttempt } from "@/lib/quiz-storage";
import { cn } from "@/lib/utils";
import { quizAttemptService } from "@/services/quiz-attempt.service";

export default function QuizReviewPage() {
  const params = useParams<{
    topicId: string;
    quizId: string;
    attemptId: string;
  }>();
  const { topicId, quizId, attemptId } = params;
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: remoteAttempt } = useQuery({
    queryKey: ["quiz-attempt-detail", attemptId],
    queryFn: () => quizAttemptService.getAttemptById(attemptId),
    enabled: !!attemptId,
    retry: false,
  });

  const localAttempt = getQuizAttempt(attemptId);
  const attempt = remoteAttempt ?? localAttempt;
  const passed = attempt
    ? isQuizPassed(
        calcQuizScorePercent(attempt.correctCount, attempt.totalQuestions)
      )
    : false;

  const currentQuestion = attempt?.questions[activeIndex];
  const selectedOptionId = currentQuestion
    ? (attempt?.answersByQuestionId[currentQuestion.id] ?? null)
    : null;
  const correctOption = useMemo(() => {
    if (!currentQuestion) return null;
    return currentQuestion.options.find((option) => option.isCorrect) ?? null;
  }, [currentQuestion]);
  const isCorrect =
    selectedOptionId !== null && selectedOptionId === correctOption?.id;

  if (!attempt) {
    return (
      <div className="min-h-screen bg-muted text-[#141414]">
        <DashboardHeader />
        <main className="mx-auto flex max-w-[1400px] flex-col items-center justify-center px-6 py-24 text-center lg:px-12">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
            <AlertCircle className="h-10 w-10 text-[#aaa]" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-[#141414]">
            Attempt not found
          </h2>
          <p className="mt-2 max-w-sm text-[15px] text-[#666]">
            This attempt does not exist or you do not have permission to view it.
          </p>
          <Link
            href={ROUTES.QUIZ_DETAIL(topicId, quizId)}
            className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Back to quiz details
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted text-[#141414]">
      <DashboardHeader />

      <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
        <div className="mb-2">
          <Link
            href={ROUTES.QUIZ_RESULT(topicId, quizId, attempt.id)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to results
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-[#141414] md:text-3xl">
            {attempt.quizTitle}
          </h1>
          <Badge
            variant={passed ? "success" : "danger"}
            className="rounded-lg"
          >
            {passed ? "Passed" : "Not passed"}
          </Badge>
          <Badge variant="info" className="rounded-lg">
            {formatQuizDateTime(attempt.submittedAt)}
          </Badge>
          <Badge variant="default" className="rounded-lg">
            {activeIndex + 1}/{attempt.questions.length}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-[#666]">
          Review each question, your selected answers, and explanations.
        </p>

        <div className="mt-8 grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#141414]">Questions</h3>
              <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6 xl:grid-cols-4">
                {attempt.questions.map((question, index) => {
                  const answered = Boolean(
                    attempt.answersByQuestionId[question.id]
                  );
                  const active = index === activeIndex;
                  const selected = question.options.find(
                    (option) =>
                      option.id === attempt.answersByQuestionId[question.id]
                  );
                  const correct = Boolean(selected?.isCorrect);

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition",
                        active
                          ? "border-primary bg-accent text-foreground"
                          : answered
                            ? correct
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-600"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span className="text-sm">{index + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#141414]">Notes</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#666]">
                <li>Green: correct answer.</li>
                <li>Red: incorrect or unanswered.</li>
                <li>Click a question number on the left to jump quickly.</li>
              </ul>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Question {activeIndex + 1}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[#141414]">
                    {currentQuestion?.content}
                  </h2>
                </div>
                {isCorrect ? (
                  <Badge variant="success" className="rounded-lg">
                    Correct
                  </Badge>
                ) : (
                  <Badge variant="danger" className="rounded-lg">
                    Incorrect
                  </Badge>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {currentQuestion?.options.map((option, optionIndex) => {
                  const isSelected = selectedOptionId === option.id;
                  const isOptionCorrect = option.isCorrect;

                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "rounded-xl border px-4 py-4 transition",
                        isOptionCorrect
                          ? "border-emerald-200 bg-emerald-50"
                          : isSelected
                            ? "border-red-200 bg-red-50"
                            : "border-border bg-background"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                            isOptionCorrect
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : isSelected
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-border bg-background text-muted-foreground"
                          )}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium leading-6 text-foreground">
                              {option.content}
                            </p>
                            {isOptionCorrect && (
                              <Badge
                                variant="success"
                                className="rounded-lg"
                              >
                                Correct answer
                              </Badge>
                            )}
                            {isSelected && !isOptionCorrect && (
                              <Badge variant="danger" className="rounded-lg">
                                Your choice
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-[#141414]">
                Explanation
              </h3>
              <div className="mt-3 rounded-xl border border-border bg-muted p-4 text-sm leading-7 text-[#666]">
                {currentQuestion?.explanation ? (
                  <p>{currentQuestion.explanation}</p>
                ) : (
                  <p>No explanation available for this question.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setActiveIndex((current) => Math.max(current - 1, 0))
                }
                disabled={activeIndex === 0}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={ROUTES.QUIZ_RESULT(topicId, quizId, attempt.id)}
                  className={cn(
                    "inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs",
                    "transition-colors hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  Back to results
                </Link>
                <Link
                  href={ROUTES.QUIZ_TOPIC(topicId)}
                  className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  Quiz list
                </Link>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setActiveIndex((current) =>
                    Math.min(current + 1, attempt.questions.length - 1)
                  )
                }
                disabled={activeIndex === attempt.questions.length - 1}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
