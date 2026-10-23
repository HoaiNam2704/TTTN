import type { PageRequest } from "@/types/api";

export type VideoStatus = 'PROCESSING' | 'READY' | 'ERROR';

export interface LessonResponseDto {
  id: string;
  title: string;
  description?: string;
  durationSeconds?: number | null;
  videoStorageKey?: string | null;
  subtitleStorageKey?: string | null;
  sortOrder: number;
  isPreview: boolean;
  videoStatus?: VideoStatus;
  hlsReady?: boolean;
  playlistUrl?: string | null;
}

/** Create lesson — video only. Subtitle: PUT /admin/lessons/{id}/subtitle */
export interface CreateLessonRequestDto {
  sectionId: string;
  title: string;
  description?: string;
  video: File;
  durationSeconds?: number;
  isPreview?: boolean;
}

/** Update lesson — multipart. Subtitle uses uploadSubtitle separately. */
export interface UpdateLessonRequestDto {
  title?: string;
  video?: File | null;
  durationSeconds?: number;
  description?: string;
  isPreview?: boolean;
}

export interface UploadSubtitleRequestDto {
  subtitle: File;
}

export interface ReorderLessonsRequestDto {
  lessonIds: string[];
}

export interface LessonListParams extends PageRequest {
  sectionId?: string;
}

/** Compat shape for video players (HLS playlist URL). */
export interface LessonVideoSourceDto {
  sourceVideoUrl: string;
}

export interface VideoStatusUpdateDto {
  lessonId: string;
  videoStatus: VideoStatus;
  hlsReady: boolean;
  playlistUrl: string | null;
  durationSeconds?: number | null;
}
