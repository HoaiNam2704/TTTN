"use client";

import { useQuery } from "@tanstack/react-query";
import { lessonService } from "@/services/lesson.service";

export function useLessonVideoUrl(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["lesson-video-url", lessonId],
    queryFn: () => lessonService.getLessonVideoUrl(lessonId!),
    enabled: !!lessonId,
    staleTime: Infinity,
    retry: 1,
  });
}
