"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, X } from "lucide-react";
import { lessonService } from "@/services/lesson.service";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { useLessonSubtitles } from "@/hooks/useLessonSubtitles";
import type { VideoStatus } from "@/types/lesson";

// ─── Props ────────────────────────────────────────────────────────────────────

interface VideoPreviewLesson {
  id: string;
  title: string;
  subtitleStorageKey?: string | null;
  videoStatus?: VideoStatus;
  hlsReady?: boolean;
  playlistUrl?: string | null;
}

interface VideoPreviewModalProps {
  lesson: VideoPreviewLesson | null;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function resolvePlaylistUrl(playlistUrl: string | null | undefined, lessonId: string) {
  if (playlistUrl) {
    if (playlistUrl.startsWith("http")) return playlistUrl;
    return `${API_BASE}${playlistUrl}`;
  }
  return lessonService.getLessonHlsUrl(lessonId);
}

// ─── VideoPreviewModal ────────────────────────────────────────────────────────

export function VideoPreviewModal({ lesson, onClose }: VideoPreviewModalProps) {
  const { data: lessonDetail, isLoading: statusLoading } = useQuery({
    queryKey: ["lesson-detail", lesson?.id],
    queryFn: () => lessonService.getLessonById(lesson!.id),
    enabled: !!lesson,
  });

  const videoStatus = lessonDetail?.videoStatus ?? lesson?.videoStatus;
  const playlistUrl = lessonDetail?.playlistUrl ?? lesson?.playlistUrl;
  const canPlay = videoStatus === "READY";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["lesson-video-url", lesson?.id],
    queryFn: () => lessonService.getLessonVideoUrl(lesson!.id),
    enabled: !!lesson && canPlay,
  });

  const { cues: subtitleCues } = useLessonSubtitles(lesson?.id, {
    hasSubtitle: Boolean(lesson?.subtitleStorageKey) && canPlay,
  });

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!lesson) return null;

  const videoUrl = canPlay
    ? resolvePlaylistUrl(playlistUrl, lesson.id) || data?.sourceVideoUrl
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      <div className="relative w-full max-w-3xl mx-4 rounded-2xl bg-[#141414] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2
            id="video-modal-title"
            className="text-base font-semibold text-white truncate pr-4"
          >
            {lesson.title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-full p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-[200px] flex items-center justify-center aspect-video bg-black">
          {(statusLoading && videoStatus === undefined) || (canPlay && isLoading && !videoUrl) ? (
            <div
              className="flex flex-col items-center gap-3 py-10"
              role="status"
              aria-label="Loading video"
            >
              <svg
                className="h-10 w-10 animate-spin text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm text-white/50">Loading video…</span>
            </div>
          ) : null}

          {videoStatus === "PROCESSING" && (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <div className="h-10 w-10 rounded-full border-4 border-white/10 border-t-amber-400 animate-spin" />
              <p className="text-sm font-semibold text-amber-300">
                Video is being processed, please check back later
              </p>
            </div>
          )}

          {videoStatus === "ERROR" && (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm font-semibold text-red-300">
                Video is temporarily unavailable
              </p>
            </div>
          )}

          {canPlay && isError && !isLoading && !videoUrl && (
            <p className="text-sm text-red-400 text-center py-10">
              Preview unavailable at this time
            </p>
          )}

          {canPlay && videoUrl && !statusLoading && (
            <div className="w-full">
              <VideoPlayer
                videoUrl={videoUrl}
                subtitleCues={subtitleCues}
                title={lesson.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
