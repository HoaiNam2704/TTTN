"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Play, Lock, Check } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollableSectionList } from "@/components/course/scrollable-section-list";
import type { SectionDetailResponseDto } from "@/types/course";
import type { LessonResponseDto } from "@/types/lesson";
import { formatDuration, sumSectionDuration } from "@/lib/formatDuration";
import { canAccessLesson } from "@/lib/curriculum";
import { ROUTES } from "@/constants/routes";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CurriculumAccordionProps {
  courseId: string;
  sections: SectionDetailResponseDto[];
  isEnrolled: boolean;
  completedLessonIds?: string[];
  /** Fallback for preview modal on course detail page */
  onPreviewClick?: (lesson: LessonResponseDto) => void;
  /** Collapsed section rows visible before inner scroll kicks in. */
  maxVisibleSections?: number;
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────

interface LessonRowProps {
  courseId: string;
  lesson: LessonResponseDto;
  isEnrolled: boolean;
  isCompleted: boolean;
  onPreviewClick?: (lesson: LessonResponseDto) => void;
}

function LessonRow({
  courseId,
  lesson,
  isEnrolled,
  isCompleted,
  onPreviewClick,
}: LessonRowProps) {
  const router = useRouter();
  const { isPreview } = lesson;
  const accessible = canAccessLesson(lesson, isEnrolled);
  const videoReady = lesson.videoStatus === "READY" || lesson.videoStatus === undefined;
  const videoProcessing = lesson.videoStatus === "PROCESSING";
  const videoError = lesson.videoStatus === "ERROR";

  const handleClick = () => {
    if (!accessible) return;
    if (!videoReady && !isEnrolled) {
      // Preview only when video is READY
      return;
    }
    if (isEnrolled) {
      // Enrolled users can open the lesson page (shows PROCESSING/ERROR placeholder)
      router.push(ROUTES.COURSE_LEARN_LESSON(courseId, lesson.id));
      return;
    }
    if (onPreviewClick && videoReady) {
      onPreviewClick(lesson);
    }
  };

  const leftIcon = isCompleted ? (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500"
      aria-label="Completed"
    >
      <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
    </span>
  ) : (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-stone-100 text-stone-600">
      <Play className="h-3.5 w-3.5 fill-stone-500 text-stone-500" />
    </span>
  );

  const durationEl =
    typeof lesson.durationSeconds === "number" ? (
    <span className="shrink-0 text-xs sm:text-sm tabular-nums text-stone-400 font-semibold">
      {formatDuration(lesson.durationSeconds)}
    </span>
  ) : null;

  let rightEl: ReactNode;
  if (isPreview) {
    if (videoProcessing) {
      rightEl = (
        <span className="shrink-0 text-xs sm:text-sm font-semibold text-amber-600">
          Processing
        </span>
      );
    } else if (videoError) {
      rightEl = (
        <span className="shrink-0 text-xs sm:text-sm font-semibold text-red-500">
          Unavailable
        </span>
      );
    } else {
      rightEl = (
        <button
          type="button"
          onClick={handleClick}
          className="shrink-0 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-violet-700 underline underline-offset-2 hover:text-violet-900 transition-colors cursor-pointer"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-800">
            <Play className="h-2.5 w-2.5 fill-white text-white ml-px" />
          </span>
          Preview
        </button>
      );
    }
  } else if (isEnrolled) {
    rightEl = isCompleted ? (
      <button
        type="button"
        onClick={handleClick}
        className="shrink-0 flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
      >
        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        Review
      </button>
    ) : (
      <button
        type="button"
        onClick={handleClick}
        className="shrink-0 flex items-center gap-1.5 rounded border border-[#00FFCC]/40 bg-[#00FFCC]/10 px-3 py-1.5 text-xs font-bold text-[#00997a] hover:bg-[#00FFCC] hover:text-[#141414] transition-all cursor-pointer shadow-sm"
      >
        <Play className="h-3.5 w-3.5 fill-current" />
        Start learning
      </button>
    );
  } else {
    rightEl = (
      <div className="flex items-center gap-1.5 text-stone-400 text-xs sm:text-sm font-semibold bg-stone-50 px-2.5 py-1.5 rounded border border-stone-200">
        <Lock className="h-3.5 w-3.5" />
        <span>Locked</span>
      </div>
    );
  }

  return (
    <li className="border-b border-stone-100 last:border-0">
      <div className="flex items-center justify-between gap-3 py-4.5 px-6 hover:bg-stone-50/50 transition-colors">
        <div className="flex items-center gap-3.5 min-w-0">
          {leftIcon}
          <span className="text-sm font-semibold text-stone-800 truncate leading-snug">
            {lesson.title}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex justify-end min-w-[90px]">
            {rightEl}
          </div>
          <div className="flex justify-end min-w-[55px]">
            {durationEl}
          </div>
        </div>
      </div>
    </li>
  );
}

// ─── CurriculumAccordion ──────────────────────────────────────────────────────

export function CurriculumAccordion({
  courseId,
  sections,
  isEnrolled,
  completedLessonIds = [],
  onPreviewClick,
  maxVisibleSections = 5,
}: CurriculumAccordionProps) {
  const completedSet = new Set(completedLessonIds);
  const shouldScroll = sections.length > maxVisibleSections;

  const accordion = (
    <Accordion>
      {sections.map((section, idx) => {
        const sortedLessons = [...section.lessons].sort(
          (a, b) => a.sortOrder - b.sortOrder
        );
        const totalDuration = sumSectionDuration(section.lessons);
        const lessonCount = section.lessons.length;
        const sectionCompleted = sortedLessons.filter((l) =>
          completedSet.has(l.id)
        ).length;

        return (
          <AccordionItem
            key={section.sectionId}
            value={section.sectionId}
            className="border-b border-stone-200 last:border-0"
          >
            <AccordionTrigger className="min-w-0 overflow-hidden bg-stone-50/40 px-6 py-5 transition-colors hover:bg-[#faf9f8] hover:no-underline">
              <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden pr-4">
                <div className="flex min-w-0 flex-1 items-center gap-4.5 overflow-hidden">
                  <span className="shrink-0 text-sm font-bold tabular-nums text-stone-400">
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="min-w-0 truncate text-left text-base font-bold text-stone-850">
                    {section.title}
                  </span>
                </div>
                <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-stone-500 sm:text-sm">
                  {isEnrolled && sectionCompleted > 0
                    ? `${sectionCompleted}/${lessonCount} lessons`
                    : `${lessonCount} ${lessonCount === 1 ? "lesson" : "lessons"}`}
                  {totalDuration !== null && (
                    <> · {formatDuration(totalDuration)}</>
                  )}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="bg-white p-0">
              <ul role="list">
                {sortedLessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    courseId={courseId}
                    lesson={lesson}
                    isEnrolled={isEnrolled}
                    isCompleted={completedSet.has(lesson.id)}
                    onPreviewClick={onPreviewClick}
                  />
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {shouldScroll ? (
        <ScrollableSectionList
          maxVisible={maxVisibleSections}
          className="rounded-xl"
        >
          {accordion}
        </ScrollableSectionList>
      ) : (
        accordion
      )}
    </div>
  );
}
