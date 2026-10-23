import { api } from "@/services/api";
import type { PageResponse } from "@/types/api";
import type { ProgressUpdatePayloadDto } from "@/types/enrollment";
import type {
  LessonVideoSourceDto,
  LessonResponseDto,
  CreateLessonRequestDto,
  UpdateLessonRequestDto,
  ReorderLessonsRequestDto,
  LessonListParams,
} from "@/types/lesson";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const HLS_MASTER_PLAYLIST = "master.m3u8";

function toFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  }
  return formData;
}

export class LessonService {
  getLessons(params: LessonListParams = {}) {
    return api.get<PageResponse<LessonResponseDto>>("/api/v1/admin/lessons", {
      sort: "sortOrder,ASC",
      ...params,
    });
  }

  getLessonById(lessonId: string) {
    return api.get<LessonResponseDto>(`/api/v1/lessons/${lessonId}`);
  }

  /** Absolute HLS master playlist URL (`master.m3u8`). Requires Bearer auth when fetching. */
  getLessonHlsUrl(lessonId: string, filename = HLS_MASTER_PLAYLIST): string {
    return `${API_BASE}/api/v1/lessons/${lessonId}/hls/${filename}`;
  }

  getLessonVideoUrl(lessonId: string): Promise<LessonVideoSourceDto> {
    return Promise.resolve({
      sourceVideoUrl: this.getLessonHlsUrl(lessonId),
    });
  }

  getLessonSubtitle(lessonId: string): Promise<string> {
    return api.getText(`/api/v1/lessons/${lessonId}/subtitle`);
  }

  /** Mark lesson complete and return updated enrollment progress. */
  completeLesson(lessonId: string) {
    return api.post<ProgressUpdatePayloadDto>(
      `/api/v1/lessons/${lessonId}/complete`
    );
  }

  /** Create lesson + video. Subtitle must use `uploadSubtitle` afterwards. */
  createLesson(data: CreateLessonRequestDto, onProgress?: (percent: number) => void) {
    const formData = toFormData({
      sectionId: data.sectionId,
      title: data.title,
      description: data.description,
      video: data.video,
      isPreview: data.isPreview,
      durationSeconds: data.durationSeconds,
    });
    return api.uploadWithProgress<LessonResponseDto>(
      "/api/v1/admin/lessons",
      formData,
      onProgress
    );
  }

  /** Update lesson metadata and/or replace video (multipart). */
  updateLesson(
    lessonId: string,
    data: UpdateLessonRequestDto,
    onProgress?: (percent: number) => void
  ) {
    const formData = toFormData({
      title: data.title,
      description: data.description,
      isPreview: data.isPreview,
      video: data.video,
      durationSeconds: data.durationSeconds,
    });

    if (data.video && onProgress) {
      return api.uploadWithProgress<LessonResponseDto>(
        `/api/v1/admin/lessons/${lessonId}`,
        formData,
        onProgress,
        "PUT"
      );
    }

    return api.put<LessonResponseDto>(`/api/v1/admin/lessons/${lessonId}`, formData);
  }

  uploadSubtitle(lessonId: string, subtitle: File) {
    const formData = toFormData({ subtitle });
    return api.put<LessonResponseDto>(
      `/api/v1/admin/lessons/${lessonId}/subtitle`,
      formData
    );
  }

  requeueTranscode(lessonId: string) {
    return api.post<LessonResponseDto>(
      `/api/v1/admin/lessons/${lessonId}/requeue-transcode`
    );
  }

  deleteLesson(lessonId: string) {
    return api.delete<void>(`/api/v1/admin/lessons/${lessonId}`);
  }

  reorderLessons(sectionId: string, data: ReorderLessonsRequestDto) {
    return api.post<void>(`/api/v1/admin/lessons/${sectionId}/reorder`, data);
  }
}

export const lessonService = new LessonService();
