"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { courseService } from "@/services/course.service";
import { lessonService } from "@/services/lesson.service";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { LearnCurriculumSidebar } from "@/components/player/LearnCurriculumSidebar";
import { useLessonVideoUrl } from "@/hooks/useLessonVideoUrl";
import { useLessonSubtitles } from "@/hooks/useLessonSubtitles";
import { useVideoStatus } from "@/hooks/useVideoStatus";
import { useAuth } from "@/hooks/useAuth";
import {
  getLessonNeighbors,
  canAccessLesson,
} from "@/lib/curriculum";
import { formatDuration } from "@/lib/formatDuration";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { CourseDetailResponseDto } from "@/types/course";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function resolvePlaylistUrl(playlistUrl: string | null | undefined, lessonId: string) {
  if (playlistUrl) {
    if (playlistUrl.startsWith("http")) return playlistUrl;
    return `${API_BASE}${playlistUrl}`;
  }
  return lessonService.getLessonHlsUrl(lessonId);
}

export default function LearnLessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { courseId, lessonId } = params;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const wsConnectedRef = useRef(false);
  /** Prevents duplicate POST /complete from progress@90% + ended + re-renders. */
  const completeRequestedRef = useRef<string | null>(null);

  useEffect(() => {
    completeRequestedRef.current = null;
  }, [lessonId]);

  const {
    data: curriculum,
    isLoading: curriculumLoading,
    isError: curriculumError,
  } = useQuery({
    queryKey: ["course-curriculum", courseId],
    queryFn: () => courseService.getCourseCurriculum(courseId),
    enabled: !!courseId && isAuthenticated,
  });

  const { data: lessonDetail, isLoading: lessonDetailLoading } = useQuery({
    queryKey: ["lesson-detail", lessonId],
    queryFn: () => lessonService.getLessonById(lessonId),
    enabled: !!lessonId && isAuthenticated,
    refetchInterval: (query) => {
      if (query.state.data?.videoStatus !== "PROCESSING") return false;
      return wsConnectedRef.current ? false : 4000;
    },
  });

  const {
    videoStatus,
    hlsReady,
    playlistUrl,
    isWsConnected,
  } = useVideoStatus(lessonId, lessonDetail);
  wsConnectedRef.current = isWsConnected;

  useEffect(() => {
    if (!lessonDetail || !videoStatus) return;
    if (
      lessonDetail.videoStatus === videoStatus &&
      lessonDetail.hlsReady === hlsReady &&
      lessonDetail.playlistUrl === playlistUrl
    ) {
      return;
    }
    queryClient.setQueryData(["lesson-detail", lessonId], {
      ...lessonDetail,
      videoStatus,
      hlsReady,
      playlistUrl,
    });
  }, [videoStatus, hlsReady, playlistUrl, lessonDetail, lessonId, queryClient]);

  const isReady = videoStatus === "READY";

  const {
    data: videoData,
    isLoading: videoLoading,
    isError: videoError,
  } = useLessonVideoUrl(isReady ? lessonId : undefined);

  const resolvedVideoUrl = useMemo(() => {
    if (!isReady) return null;
    if (playlistUrl) return resolvePlaylistUrl(playlistUrl, lessonId);
    return videoData?.sourceVideoUrl ?? resolvePlaylistUrl(null, lessonId);
  }, [isReady, playlistUrl, lessonId, videoData?.sourceVideoUrl]);

  const currentLessonHasSubtitle =
    curriculum?.sections.some((section) =>
      section.lessons.some(
        (lesson) => lesson.id === lessonId && Boolean(lesson.subtitleStorageKey)
      )
    ) ?? false;

  const { cues: subtitleCues } = useLessonSubtitles(lessonId, {
    hasSubtitle: currentLessonHasSubtitle && isReady,
  });

  const neighbors = useMemo(() => {
    if (!curriculum) return { current: null, prev: null, next: null };
    return getLessonNeighbors(
      curriculum.sections,
      lessonId,
      curriculum.isEnrolled
    );
  }, [curriculum, lessonId]);

  const markLessonComplete = useCallback(() => {
    if (!curriculum?.isEnrolled) return;
    if ((curriculum.completedLessonIds ?? []).includes(lessonId)) return;
    if (completeRequestedRef.current === lessonId) return;
    completeRequestedRef.current = lessonId;

    void lessonService
      .completeLesson(lessonId)
      .then((payload) => {
        queryClient.setQueryData<CourseDetailResponseDto>(
          ["course-curriculum", courseId],
          (prev) => {
            if (!prev) return prev;
            const ids = new Set(prev.completedLessonIds ?? []);
            ids.add(lessonId);
            return {
              ...prev,
              completedLessonIds: Array.from(ids),
              progressPercent:
                payload.progressPercent ?? prev.progressPercent,
            };
          }
        );
      })
      .catch(() => {
        if (completeRequestedRef.current === lessonId) {
          completeRequestedRef.current = null;
        }
      });
  }, [courseId, curriculum, lessonId, queryClient]);

  const handleProgress = useCallback(
    (percent: number) => {
      if (percent < 90) return;
      markLessonComplete();
    },
    [markLessonComplete]
  );

  const handleEnded = useCallback(() => {
    markLessonComplete();
    if (neighbors.next) {
      router.push(`/courses/${courseId}/learn/${neighbors.next.id}`);
    }
  }, [courseId, markLessonComplete, neighbors.next, router]);

  if (authLoading) {
    return <LearnSkeleton />;
  }

  if (!isAuthenticated) {
    router.replace(ROUTES.LOGIN);
    return null;
  }

  if (curriculumLoading) {
    return <LearnSkeleton />;
  }

  if (curriculumError || !curriculum) {
    return (
      <ErrorState
        message="Could not load course content."
        backHref={`/courses/${courseId}`}
      />
    );
  }

  const { current, prev, next } = neighbors;

  if (!current || !canAccessLesson(current, curriculum.isEnrolled)) {
    return (
      <ErrorState
        message="You do not have access to this lesson. Please enroll in the course."
        backHref={`/courses/${courseId}`}
      />
    );
  }
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — course title + curriculum once */}
      <div className="hidden w-[320px] shrink-0 lg:flex xl:w-[360px]">
        <LearnCurriculumSidebar
          courseId={courseId}
          courseTitle={curriculum.title}
          sections={curriculum.sections}
          isEnrolled={curriculum.isEnrolled}
          activeLessonId={lessonId}
          completedLessonIds={curriculum.completedLessonIds}
          progressPercent={curriculum.progressPercent}
        />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-sm shadow-xl">
            <LearnCurriculumSidebar
              courseId={courseId}
              courseTitle={curriculum.title}
              sections={curriculum.sections}
              isEnrolled={curriculum.isEnrolled}
              activeLessonId={lessonId}
              completedLessonIds={curriculum.completedLessonIds}
              progressPercent={curriculum.progressPercent}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Top bar — lesson title only (course title lives in sidebar) */}
        <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur-sm sm:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Open lesson list"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {current.sectionTitle}
            </p>
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
              {current.title}
            </h1>
          </div>
        </header>

        {/* Player — full width of main pane */}
        <div className="shrink-0 bg-black">
          {(lessonDetailLoading && videoStatus === undefined) && (
            <div className="flex aspect-video items-center justify-center bg-zinc-950">
              <div className="flex flex-col items-center gap-3">
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-white" />
                <span className="text-xs text-white/50">Loading video information…</span>
              </div>
            </div>
          )}

          {videoStatus === "PROCESSING" && (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-zinc-950">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/10 border-t-amber-400" />
              <div className="px-6 text-center">
                <p className="text-sm font-medium text-amber-300">
                  Video is being processed, please check back later
                </p>
                <p className="mt-1 text-xs text-white/40">
                  The system is transcoding the video to HLS
                </p>
              </div>
            </div>
          )}

          {videoStatus === "ERROR" && (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-zinc-950">
              <AlertCircle className="h-9 w-9 text-red-400" />
              <div className="px-6 text-center">
                <p className="text-sm font-medium text-red-300">
                  Video is temporarily unavailable
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Please check back later or contact an administrator
                </p>
              </div>
            </div>
          )}

          {isReady && (
            <>
              {videoLoading && !resolvedVideoUrl && (
                <div className="flex aspect-video items-center justify-center bg-zinc-950">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/10 border-t-white" />
                    <span className="text-xs text-white/50">Loading video…</span>
                  </div>
                </div>
              )}
              {videoError && !videoLoading && !resolvedVideoUrl && (
                <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-zinc-950">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-sm text-red-300">Could not load video. Please try again.</p>
                </div>
              )}
              {resolvedVideoUrl && (
                <VideoPlayer
                  key={lessonId}
                  videoUrl={resolvedVideoUrl}
                  subtitleCues={subtitleCues}
                  title={current.title}
                  lockSeekAhead={
                    curriculum.isEnrolled &&
                    !(curriculum.completedLessonIds ?? []).includes(lessonId)
                  }
                  onProgress={handleProgress}
                  onEnded={handleEnded}
                />
              )}
            </>
          )}
        </div>

        {/* Lesson meta — no duplicate card, title shown once in header */}
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {current.description && (
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {current.description}
            </p>
          )}

          {typeof current.durationSeconds === "number" && (
            <div className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(current.durationSeconds)}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            {prev ? (
              <Link
                href={`/courses/${courseId}/learn/${prev.id}`}
                className={cn(
                  "inline-flex max-w-[45%] items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2",
                  "text-sm font-medium text-foreground",
                  "transition-colors hover:bg-muted"
                )}
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">{prev.title}</span>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/courses/${courseId}/learn/${next.id}`}
                className={cn(
                  "inline-flex max-w-[45%] items-center gap-1.5 rounded-md bg-primary px-3 py-2",
                  "text-sm font-medium text-primary-foreground",
                  "transition-colors hover:bg-primary/90"
                )}
              >
                <span className="truncate">{next.title}</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : (
              <Link
                href={`/courses/${courseId}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2",
                  "text-sm font-medium text-primary-foreground",
                  "transition-colors hover:bg-primary/90"
                )}
              >
                Completed
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function LearnSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <div className="hidden w-[320px] animate-pulse border-r border-border bg-muted/40 lg:block" />
      <div className="flex flex-1 flex-col">
        <div className="h-12 animate-pulse border-b border-border bg-muted/40" />
        <div className="aspect-video animate-pulse bg-muted" />
        <div className="mx-auto mt-5 h-20 w-full max-w-3xl animate-pulse rounded-md bg-muted/50 px-4" />
      </div>
    </div>
  );
}

function ErrorState({
  message,
  backHref,
}: {
  message: string;
  backHref: string;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-6 w-6 text-foreground" />
        </div>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ChevronLeft className="h-4 w-4" />
          Go back
        </Link>
      </div>
    </div>
  );
}
