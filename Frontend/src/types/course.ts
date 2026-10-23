import type { PageRequest } from "@/types/api";
import type { LessonResponseDto } from "@/types/lesson";

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface AdminCourseResponseDto {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  categoryId: string;
  status?: CourseStatus;
  level: CourseLevel;
  price?: number;
  thumbnailUrl?: string;
  averageRating?: number;
  reviewCount?: number;
}

export interface UserCourseResponseDto {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  categoryId: string;
  status?: CourseStatus;
  level: CourseLevel;
  price?: number;
  thumbnailUrl?: string;
  isEnrolled?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export type CourseResponseDto = UserCourseResponseDto;

export interface CreateCourseRequestDto {
  title: string;
  description?: string;
  categoryId: string;
  status?: CourseStatus;
  level: CourseLevel;
  price?: number;
  thumbnail?: File | null;
}

export interface UpdateCourseRequestDto {
  title: string;
  description?: string;
  categoryId: string;
  status: CourseStatus;
  level: CourseLevel;
  price?: number;
  thumbnail?: File | null;
}

export interface CourseListParams extends PageRequest {
  title?: string;
  categoryId?: string;
  status?: CourseStatus;
  level?: CourseLevel;
  minRating?: number;
  maxRating?: number;
}

export interface SectionDetailResponseDto {
  sectionId: string;
  title: string;
  description?: string;
  lessons: LessonResponseDto[];
}

export interface CourseDetailResponseDto {
  courseId: string;
  title: string;
  slug: string;
  description: string;
  thumbnailPresignedUrl: string | null;
  isEnrolled: boolean;
  /** Present when enrolled; null/undefined for guests. */
  progressPercent?: number | null;
  /** Lesson IDs the current user has completed (empty when not enrolled). */
  completedLessonIds?: string[];
  /** Number of active enrollments for this course. */
  enrollmentCount?: number;
  sections: SectionDetailResponseDto[];
}
