"use client";

import Link from "next/link";
import { Play, Lock, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/formatDuration";
import { canAccessLesson } from "@/lib/curriculum";
import type { LessonResponseDto } from "@/types/lesson";
import type { SectionDetailResponseDto } from "@/types/course";

interface LearnCurriculumSidebarProps {
  courseId: string;
  courseTitle: string;
  sections: SectionDetailResponseDto[];
  isEnrolled: boolean;
  activeLessonId: string;
  completedLessonIds?: string[];
  progressPercent?: number | null;
  onNavigate?: () => void;
}

export function LearnCurriculumSidebar({
  courseId,
  courseTitle,
  sections,
  isEnrolled,
  activeLessonId,
  completedLessonIds = [],
  progressPercent,
  onNavigate,
}: LearnCurriculumSidebarProps) {
  const completedSet = new Set(completedLessonIds);
  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const completedCount = completedLessonIds.length;
  const displayPercent =
    typeof progressPercent === "number"
      ? progressPercent
      : totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 1000) / 10
        : 0;

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card text-card-foreground">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <Link
          href={`/courses/${courseId}`}
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to course
        </Link>
        <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {courseTitle}
        </h2>
        {isEnrolled && (
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {completedCount}/{totalLessons} lessons completed
              </span>
              <span className="tabular-nums font-semibold text-foreground">
                {displayPercent}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, displayPercent))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto" aria-label="Course content">
        {sections.map((section, sectionIdx) => {
          const lessons = [...section.lessons].sort(
            (a, b) => a.sortOrder - b.sortOrder
          );
          if (lessons.length === 0) return null;

          return (
            <div key={section.sectionId} className="border-b border-border last:border-b-0">
              <div className="sticky top-0 z-10 bg-muted/80 px-4 py-2 backdrop-blur-sm">
                <p className="truncate text-xs font-semibold text-muted-foreground">
                  {section.title || `Section ${sectionIdx + 1}`}
                </p>
              </div>
              <ul role="list">
                {lessons.map((lesson, lessonIdx) => (
                  <LessonNavItem
                    key={lesson.id}
                    lesson={lesson}
                    index={lessonIdx + 1}
                    courseId={courseId}
                    isActive={lesson.id === activeLessonId}
                    isAccessible={canAccessLesson(lesson, isEnrolled)}
                    isCompleted={completedSet.has(lesson.id)}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function LessonNavItem({
  lesson,
  index,
  courseId,
  isActive,
  isAccessible,
  isCompleted,
  onNavigate,
}: {
  lesson: LessonResponseDto;
  index: number;
  courseId: string;
  isActive: boolean;
  isAccessible: boolean;
  isCompleted: boolean;
  onNavigate?: () => void;
}) {
  const content = (
    <div
      className={cn(
        "flex items-start gap-2.5 px-4 py-2.5 transition-colors",
        isActive && "bg-accent",
        isAccessible && !isActive && "hover:bg-muted/60",
        !isAccessible && "cursor-not-allowed opacity-50"
      )}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        {isCompleted ? (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500"
            aria-label="Completed"
          >
            <Check className="h-3 w-3 text-white stroke-[3]" />
          </span>
        ) : isAccessible ? (
          isActive ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
              <Play className="h-2.5 w-2.5 fill-primary-foreground text-primary-foreground" />
            </span>
          ) : (
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {index}
            </span>
          )
        ) : (
          <Lock className="h-3.5 w-3.5 text-muted-foreground/70" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13px] leading-snug",
            isActive ? "font-semibold text-foreground" : "text-foreground/80",
            isCompleted && !isActive && "text-muted-foreground"
          )}
        >
          {lesson.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          {typeof lesson.durationSeconds === "number" && (
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {formatDuration(lesson.durationSeconds)}
            </span>
          )}
          {isCompleted && (
            <span className="text-[10px] font-medium text-emerald-600">
              Completed
            </span>
          )}
          {lesson.isPreview && !isCompleted && (
            <span className="text-[10px] font-medium text-muted-foreground">
              Preview
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (!isAccessible) {
    return <li>{content}</li>;
  }

  return (
    <li>
      <Link
        href={`/courses/${courseId}/learn/${lesson.id}`}
        className="block"
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
      >
        {content}
      </Link>
    </li>
  );
}
