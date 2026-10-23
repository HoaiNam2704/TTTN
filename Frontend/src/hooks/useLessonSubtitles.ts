"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { lessonService } from "@/services/lesson.service";
import { parseVtt, type SubtitleCue } from "@/lib/subtitles";

interface UseLessonSubtitlesOptions {
  /** Only fetch when the lesson has a subtitle on the backend. */
  hasSubtitle?: boolean;
}

const EMPTY_CUES: SubtitleCue[] = [];

export function useLessonSubtitles(
  lessonId: string | undefined,
  options: UseLessonSubtitlesOptions = {}
) {
  const { hasSubtitle = true } = options;

  const query = useQuery({
    queryKey: ["lesson-subtitle", lessonId],
    queryFn: () => lessonService.getLessonSubtitle(lessonId!),
    enabled: !!lessonId && hasSubtitle,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const cues = useMemo(
    () => (query.data ? parseVtt(query.data) : EMPTY_CUES),
    [query.data]
  );

  return {
    cues,
    hasSubtitles: cues.length > 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
