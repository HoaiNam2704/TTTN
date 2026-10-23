"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  ListChecks,
  ShieldAlert,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { quizService } from "@/services/quiz.service";
import { quizAttemptService } from "@/services/quiz-attempt.service";
import {
  formatQuizMinutes,
  getQuestionCount,
  formatQuizDateTime,
} from "@/lib/quiz-flow";
import {
  QUIZ_MAX_SCORE,
  QUIZ_PASS_PERCENT,
  calcQuizScorePercent,
  isQuizPassed,
} from "@/lib/quiz-scoring";
import { getLatestQuizAttempt } from "@/lib/quiz-storage";
import { cn } from "@/lib/utils";

export default function QuizDetailPage() {
  const params = useParams<{ topicId: string; quizId: string }>();
  const { topicId, quizId } = params;

  const {
    data: quiz,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["quiz-detail-page", quizId],
    queryFn: () => quizService.getQuizById(quizId),
    enabled: !!quizId,
  });

  const { data: remoteLatestAttempt } = useQuery({
    queryKey: ["quiz-latest-attempt", quizId],
    queryFn: () => quizAttemptService.getLatestAttemptByQuizId(quizId),
    enabled: !!quizId,
    retry: false,
  });

  const latestAttempt = remoteLatestAttempt ?? getLatestQuizAttempt(quizId);
  const latestScore = useMemo(() => {
    if (!latestAttempt) return null;
    const scorePercent = calcQuizScorePercent(
      latestAttempt.correctCount,
      latestAttempt.totalQuestions
    );
    return {
      scorePercent,
      passed: isQuizPassed(scorePercent),
    };
  }, [latestAttempt]);

  return (
    <div className="min-h-screen bg-muted text-[#141414]">
      <DashboardHeader />

      <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
        <div className="mb-2">
          <Link
            href={ROUTES.QUIZ_TOPIC(topicId)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to quiz list
          </Link>
        </div>

        {isLoading && (
          <div className="mt-6 animate-pulse space-y-4">
            <div className="h-8 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-20 rounded-xl bg-gray-200" />
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div className="mt-6">
            <Alert
              type="error"
              message={
                error instanceof Error
                  ? error.message
                  : "Could not load quiz details."
              }
            />
          </div>
        )}

        {!isLoading && !isError && quiz && (
          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-[#141414] md:text-3xl">
                    {quiz.title}
                  </h1>
                  <Badge
                    variant={quiz.isPublished ? "success" : "warning"}
                    className="rounded-lg"
                  >
                    {quiz.isPublished ? "Published" : "Unpublished"}
                  </Badge>
                  <Badge variant="info" className="rounded-lg">
                    {quiz.topicName}
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl text-sm text-[#666]">
                  {quiz.description ||
                    "Review the quiz structure before you start."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    Duration
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatQuizMinutes(quiz.duration)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Passing score
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {QUIZ_PASS_PERCENT}%
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <ListChecks className="h-3.5 w-3.5" />
                    Questions
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {getQuestionCount(quiz)} {getQuestionCount(quiz) === 1 ? "question" : "questions"}
                  </p>
                </div>
              </div>

              {latestAttempt && latestScore && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-[#141414]">
                    Latest attempt
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-muted px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Score
                      </p>
                      <p className="mt-1 text-lg font-bold text-foreground">
                        {latestScore.scorePercent}/{QUIZ_MAX_SCORE}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Result
                      </p>
                      <p className="mt-1 text-lg font-bold text-foreground">
                        {latestScore.passed ? "Passed" : "Not passed"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Submitted
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatQuizDateTime(latestAttempt.submittedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {quiz.questions.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-[#141414]">
                      Question list
                    </h2>
                    <Badge variant="default" className="rounded-lg">
                      {quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {quiz.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="flex items-start gap-3 rounded-xl border border-border bg-muted px-4 py-3"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {question.content}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {question.options.length} {question.options.length === 1 ? "option" : "options"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-20">
                <h3 className="text-base font-semibold text-[#141414]">
                  Ready to start
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#666]">
                  When you start the quiz, the timer will count down and your answer
                  progress will be saved temporarily on this device.
                </p>
                <div className="mt-4 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Read each question carefully before selecting an answer.
                </div>
                <Link
                  href={ROUTES.QUIZ_ATTEMPT(topicId, quiz.id)}
                  className={cn(
                    "mt-5 inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition",
                    quiz.isPublished
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "pointer-events-none bg-secondary text-muted-foreground"
                  )}
                >
                  Start quiz
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
