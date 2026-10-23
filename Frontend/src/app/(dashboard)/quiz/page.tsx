"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, History, Target } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { quizService } from "@/services/quiz.service";
import type { TopicResponseDto } from "@/types/quiz";
import { IconBook } from "@/components/common/icons";
import { cn } from "@/lib/utils";

const TOPIC_COLORS = [
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
];

function getTopicColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length];
}

function TopicCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-border bg-card p-5">
      <div className="mb-4 h-10 w-10 rounded-lg bg-gray-200" />
      <div className="h-5 w-2/3 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-full rounded bg-gray-200" />
      <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />
    </div>
  );
}

function TopicEmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <IconBook className="h-10 w-10 text-[#aaa]" />
      </div>
      <h3 className="mt-6 text-xl font-semibold text-[#141414]">
        No practice topics yet
      </h3>
      <p className="mt-2 max-w-sm text-[15px] text-[#666]">
        Topics will appear here once they are created in the system.
      </p>
      <Link
        href={ROUTES.DASHBOARD}
        className="mt-6 text-sm font-semibold text-primary transition hover:underline"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}

function TopicCard({ topic }: { topic: TopicResponseDto }) {
  const colorClass = getTopicColor(topic.id);
  const quizCount = topic.quizCount ?? 0;

  return (
    <Link
      href={ROUTES.QUIZ_TOPIC(topic.id)}
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent"
    >
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${colorClass}`}
      >
        <Target className="h-5 w-5" />
      </div>
      <h3 className="text-[15px] font-semibold text-[#141414] transition-colors group-hover:text-primary">
        {topic.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[13px] text-[#666]">
        {topic.description || "This topic has no detailed description yet."}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">
          {quizCount} {quizCount === 1 ? "quiz" : "quizzes"}
        </p>
        <span className="inline-flex items-center text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
          View
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default function QuizLandingPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["quiz-topics"],
    queryFn: () => quizService.getTopics({ page: 0, size: 100 }),
  });

  const topics = data?.content ?? [];

  return (
    <div className="min-h-screen bg-muted text-[#141414]">
      <DashboardHeader />

      <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12">
        <section aria-labelledby="quiz-landing-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                id="quiz-landing-heading"
                className="text-2xl font-bold text-[#141414] md:text-3xl"
              >
                Practice
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#666]">
                Choose a topic to practice, take quizzes, and review results right in the
                system.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="rounded-lg">
                {topics.length} {topics.length === 1 ? "topic" : "topics"}
              </Badge>
              <Link
                href={ROUTES.QUIZ_HISTORY}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-xs",
                  "transition-colors hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <History className="h-3.5 w-3.5" />
                Attempt history
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading &&
              Array.from({ length: 8 }).map((_, index) => (
                <TopicCardSkeleton key={index} />
              ))}

            {isError && (
              <div className="col-span-full">
                <Alert
                  type="error"
                  message={
                    error instanceof Error
                      ? error.message
                      : "Could not load practice topics."
                  }
                />
              </div>
            )}

            {!isLoading && !isError && topics.length === 0 && (
              <TopicEmptyState />
            )}

            {!isLoading &&
              !isError &&
              topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
