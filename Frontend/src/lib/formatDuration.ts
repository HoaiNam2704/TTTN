import type { LessonResponseDto } from "@/types/lesson";

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function sumSectionDuration(lessons: LessonResponseDto[]): number | null {
  const durations = lessons
    .map((l) => l.durationSeconds)
    .filter((d): d is number => typeof d === "number");
  return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) : null;
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(0);
      return;
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
}
