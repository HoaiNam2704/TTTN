"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertCircle, ArrowRight, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { formatQuizDateTime, formatQuizElapsed } from "@/lib/quiz-flow";
import { QUIZ_MAX_SCORE, calcQuizScorePercent, isQuizPassed } from "@/lib/quiz-scoring";
import { getQuizAttempts, historyToRows } from "@/lib/quiz-storage";
import { quizAttemptService } from "@/services/quiz-attempt.service";
import { cn } from "@/lib/utils";

export default function QuizHistoryPage() {
  const { data: remoteAttempts, isError } = useQuery({
    queryKey: ["quiz-history"],
    queryFn: () => quizAttemptService.getMyAttempts({ size: 1000 }),
    retry: false,
  });

  const localAttempts = getQuizAttempts();
  const attempts = useMemo(() => {
    if (remoteAttempts?.content) {
      return remoteAttempts.content;
    }
    return historyToRows(localAttempts).sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [localAttempts, remoteAttempts]);

  return (
    <div className="min-h-screen bg-muted text-[#141414]">
      <DashboardHeader />

      <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#141414] md:text-3xl">
              Attempt history
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#666]">
              Review your practice attempts, scores, and retake quizzes when needed.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="rounded-lg">
              {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}
            </Badge>
            <Link
              href={ROUTES.QUIZ}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-xs",
                "transition-colors hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Back to Practice
            </Link>
          </div>
        </div>

        {isError ? (
          <Alert
            type="warning"
            message="Could not load history from the server. Showing locally saved data on this device."
            className="mt-6"
          />
        ) : null}

        {attempts.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
              <AlertCircle className="h-10 w-10 text-[#aaa]" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-[#141414]">
              No attempt history yet
            </h2>
            <p className="mt-2 max-w-sm text-[15px] text-[#666]">
              When you submit your first quiz, your history will appear here.
            </p>
            <Link
              href={ROUTES.QUIZ}
              className="mt-6 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Start practicing
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Quiz name</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Time spent</TableHead>
                  <TableHead>Date taken</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => {
                  const scorePercent = calcQuizScorePercent(
                    attempt.correctCount,
                    attempt.totalQuestions
                  );
                  const passed = isQuizPassed(scorePercent);

                  return (
                  <TableRow key={attempt.id}>
                    <TableCell className="px-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium text-foreground">
                          {attempt.quizTitle}
                        </span>
                        <Badge
                          variant={passed ? "success" : "warning"}
                          className="w-fit rounded-lg"
                        >
                          {passed ? "Passed" : "Not passed"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {attempt.topicName}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {scorePercent}/{QUIZ_MAX_SCORE}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatQuizElapsed(attempt.elapsedSeconds)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatQuizDateTime(attempt.submittedAt)}
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <Link
                          href={ROUTES.QUIZ_RESULT(
                            attempt.topicId,
                            attempt.quizId,
                            attempt.id
                          )}
                          className={cn(
                            "inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-xs",
                            "transition-colors hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          View results
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={ROUTES.QUIZ_ATTEMPT(
                            attempt.topicId,
                            attempt.quizId
                          )}
                          className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Retake
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
