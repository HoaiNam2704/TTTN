"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ROUTES } from "@/constants/routes";
import { formatQuizDateTime, formatQuizElapsed } from "@/lib/quiz-flow";
import {
  QUIZ_MAX_SCORE,
  QUIZ_PASS_PERCENT,
  calcQuizScorePercent,
  isQuizPassed,
} from "@/lib/quiz-scoring";
import { getQuizAttempt } from "@/lib/quiz-storage";
import { quizAttemptService } from "@/services/quiz-attempt.service";
import { cn } from "@/lib/utils";

export default function QuizResultPage() {
  const params = useParams<{
    topicId: string;
    quizId: string;
    attemptId: string;
  }>();
  const { topicId, quizId, attemptId } = params;

  const { data: remoteAttempt } = useQuery({
    queryKey: ["quiz-attempt-detail", attemptId],
    queryFn: () => quizAttemptService.getAttemptById(attemptId),
    enabled: !!attemptId,
    retry: false,
  });

  const localAttempt = getQuizAttempt(attemptId);
  const attempt = remoteAttempt ?? localAttempt;

  const score = useMemo(() => {
    if (!attempt) return null;
    const scorePercent = calcQuizScorePercent(
      attempt.correctCount,
      attempt.totalQuestions
    );
    return {
      scorePercent,
      passed: isQuizPassed(scorePercent),
    };
  }, [attempt]);

  return (
    <div className="min-h-screen bg-muted text-[#141414]">
      <DashboardHeader />

      <main className="mx-auto max-w-3xl px-6 py-10 lg:px-8">
        <div className="mb-6">
          <Link
            href={ROUTES.QUIZ_TOPIC(topicId)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to quiz list
          </Link>
        </div>

        {!attempt || !score ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <AlertCircle className="h-9 w-9 text-[#aaa]" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-[#141414]">
              Result not found
            </h2>
            <p className="mt-2 max-w-sm text-[15px] text-[#666]">
              This attempt was not saved or you do not have permission to view it.
            </p>
            <Link
              href={ROUTES.QUIZ_TOPIC(topicId)}
              className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Back to quiz list
            </Link>
          </div>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div
              className={cn(
                "px-6 py-10 text-center sm:px-10",
                score.passed
                  ? "bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_72%)]"
                  : "bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_72%)]"
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {attempt.topicName}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {attempt.quizTitle}
              </h1>

              <div className="mt-8 flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 bg-white shadow-sm sm:h-32 sm:w-32",
                    score.passed
                      ? "border-emerald-500 text-emerald-700"
                      : "border-amber-500 text-amber-700"
                  )}
                >
                  <span className="text-4xl font-bold tabular-nums sm:text-5xl">
                    {score.scorePercent}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    /{QUIZ_MAX_SCORE}
                  </span>
                </div>

                <div
                  className={cn(
                    "mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold",
                    score.passed
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  )}
                >
                  {score.passed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {score.passed ? "Passed" : "Not passed"}
                </div>

                <p className="mt-3 max-w-md text-sm text-muted-foreground">
                  {score.passed
                    ? `You scored above the ${QUIZ_PASS_PERCENT}% threshold to complete this quiz.`
                    : `You need at least ${QUIZ_PASS_PERCENT}% to pass. Review your answers and try again.`}
                </p>
              </div>
            </div>

            <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
              <div className="bg-card px-5 py-4 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Target className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Correct answers
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {attempt.correctCount}/{attempt.totalQuestions}
                </p>
              </div>
              <div className="bg-card px-5 py-4 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Time spent
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {formatQuizElapsed(attempt.elapsedSeconds)}
                </p>
              </div>
              <div className="bg-card px-5 py-4 text-center">
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Submitted
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {formatQuizDateTime(attempt.submittedAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
              <Link
                href={ROUTES.QUIZ_REVIEW(topicId, quizId, attempt.id)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Review
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={ROUTES.QUIZ_ATTEMPT(topicId, quizId)}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-input bg-background px-4 text-sm font-medium shadow-xs",
                    "transition-colors hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </Link>
                <Link
                  href={ROUTES.QUIZ_TOPIC(topicId)}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium shadow-xs",
                    "transition-colors hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  Quiz list
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
