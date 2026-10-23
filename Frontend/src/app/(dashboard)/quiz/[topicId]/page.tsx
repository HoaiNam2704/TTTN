"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock3,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { quizService } from "@/services/quiz.service";
import { quizAttemptService } from "@/services/quiz-attempt.service";
import { formatQuizMinutes } from "@/lib/quiz-flow";
import {
  QUIZ_MAX_SCORE,
  QUIZ_PASS_PERCENT,
  calcQuizScorePercent,
  isQuizPassed,
} from "@/lib/quiz-scoring";
import { getLatestQuizAttempt } from "@/lib/quiz-storage";
import type { QuizResponseDto } from "@/types/quiz";
import { cn } from "@/lib/utils";

function QuizCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 h-5 w-2/3 rounded bg-gray-200" />
      <div className="mb-3 h-4 w-full rounded bg-gray-200" />
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="h-16 rounded-xl bg-gray-200" />
        <div className="h-16 rounded-xl bg-gray-200" />
        <div className="h-16 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

export default function QuizTopicPage() {
  const params = useParams<{ topicId: string }>();
  const topicId = params.topicId;

  const {
    data: topic,
    isLoading: topicLoading,
    isError: topicError,
    error: topicFetchError,
  } = useQuery({
    queryKey: ["quiz-topic-detail", topicId],
    queryFn: () => quizService.getTopicById(topicId),
    enabled: !!topicId,
  });

  const { data: remoteAttempts } = useQuery({
    queryKey: ["quiz-history-summary"],
    queryFn: () => quizAttemptService.getMyAttempts({ size: 1000 }),
    retry: false,
  });

  const quizzes = topic?.quizzes ?? [];
  const publishedCount = quizzes.filter((quiz) => quiz.isPublished).length;

  return (
    <div className="min-h-screen bg-muted text-[#141414]">
      <DashboardHeader />

      <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
        <div className="mb-2">
          <Link
            href={ROUTES.QUIZ}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All topics
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#141414] md:text-3xl">
              {topic?.name || "Loading topic..."}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-[#666]">
              {topic?.description ||
                "Quizzes by topic so you can practice quickly and stay focused."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="rounded-lg">
              {quizzes.length} quiz
            </Badge>
            <Badge variant="success" className="rounded-lg">
              {publishedCount} published
            </Badge>
            <Link
              href={ROUTES.QUIZ_HISTORY}
              className={cn(
                "inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium shadow-xs",
                "transition-colors hover:bg-accent hover:text-accent-foreground"
              )}
            >
              History
            </Link>
          </div>
        </div>

        {topicLoading && (
          <div className="mt-8 grid gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <QuizCardSkeleton key={index} />
            ))}
          </div>
        )}

        {topicError && (
          <div className="mt-8">
            <Alert
              type="error"
              message={
                topicFetchError instanceof Error
                  ? topicFetchError.message
                  : "Could not load topic details."
              }
            />
          </div>
        )}

        {!topicLoading && !topicError && topic && (
          <div className="mt-8 space-y-4">
            {quizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                  <ScrollText className="h-10 w-10 text-[#aaa]" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-[#141414]">
                  No quizzes yet
                </h3>
                <p className="mt-2 max-w-sm text-[15px] text-[#666]">
                  Create a quiz in the system to start practicing.
                </p>
              </div>
            ) : (
              quizzes.map((quiz: QuizResponseDto) => {
                const isPublished = quiz.isPublished;
                const latestAttempt =
                  remoteAttempts?.content.find(
                    (attempt) => attempt.quizId === quiz.id
                  ) ?? getLatestQuizAttempt(quiz.id);
                const questionCount = latestAttempt?.totalQuestions;

                return (
                  <div
                    key={quiz.id}
                    className={cn(
                      "rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30",
                      !isPublished && "opacity-80"
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-[#141414]">
                            {quiz.title}
                          </h3>
                          <Badge
                            variant={isPublished ? "success" : "warning"}
                            className="rounded-lg"
                          >
                            {isPublished ? "Published" : "Unpublished"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#666]">
                          {quiz.description || "This quiz has no detailed description yet."}
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl border border-border bg-muted px-4 py-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Clock3 className="h-3.5 w-3.5" />
                              Duration
                            </div>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {formatQuizMinutes(quiz.duration)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-muted px-4 py-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              Passing score
                            </div>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {QUIZ_PASS_PERCENT}%
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-muted px-4 py-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <BookOpen className="h-3.5 w-3.5" />
                              Questions
                            </div>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {questionCount != null
                                ? `${questionCount} ${questionCount === 1 ? "question" : "questions"}`
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col gap-3 lg:w-56">
                        {latestAttempt ? (
                          <div className="rounded-xl border border-border bg-muted px-4 py-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              Latest attempt
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {calcQuizScorePercent(
                                latestAttempt.correctCount,
                                latestAttempt.totalQuestions
                              )}
                              /{QUIZ_MAX_SCORE} points
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {isQuizPassed(
                                calcQuizScorePercent(
                                  latestAttempt.correctCount,
                                  latestAttempt.totalQuestions
                                )
                              )
                                ? "Passed"
                                : "Not passed"}{" "}
                              •{" "}
                              {calcQuizScorePercent(
                                latestAttempt.correctCount,
                                latestAttempt.totalQuestions
                              )}
                              %
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                            No attempt history yet.
                          </div>
                        )}

                        <Link
                          href={ROUTES.QUIZ_ATTEMPT(topic.id, quiz.id)}
                          aria-disabled={!isPublished}
                          className={cn(
                            "inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition",
                            isPublished
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "pointer-events-none bg-secondary text-muted-foreground"
                          )}
                        >
                          {isPublished ? "Start" : "Unpublished"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
