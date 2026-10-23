import type {
  CourseDetailResponseDto,
  SectionDetailResponseDto,
} from "@/types/course";
import type { LessonResponseDto } from "@/types/lesson";

export interface FlatLesson extends LessonResponseDto {
  sectionId: string;
  sectionTitle: string;
  sectionIndex: number;
}

export function flattenLessons(sections: SectionDetailResponseDto[]): FlatLesson[] {
  return sections.flatMap((section, sectionIndex) =>
    [...section.lessons]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((lesson) => ({
        ...lesson,
        sectionId: section.sectionId,
        sectionTitle: section.title,
        sectionIndex,
      }))
  );
}

export function canAccessLesson(
  lesson: LessonResponseDto,
  isEnrolled: boolean
): boolean {
  return lesson.isPreview || isEnrolled;
}

export function getFirstAccessibleLesson(
  data: CourseDetailResponseDto
): FlatLesson | null {
  const lessons = flattenLessons(data.sections);
  return lessons.find((l) => canAccessLesson(l, data.isEnrolled)) ?? null;
}

export function getLessonNeighbors(
  sections: SectionDetailResponseDto[],
  lessonId: string,
  isEnrolled: boolean
): { current: FlatLesson | null; prev: FlatLesson | null; next: FlatLesson | null } {
  const accessible = flattenLessons(sections).filter((l) =>
    canAccessLesson(l, isEnrolled)
  );
  const idx = accessible.findIndex((l) => l.id === lessonId);
  if (idx === -1) {
    return { current: null, prev: null, next: null };
  }
  return {
    current: accessible[idx],
    prev: idx > 0 ? accessible[idx - 1] : null,
    next: idx < accessible.length - 1 ? accessible[idx + 1] : null,
  };
}
