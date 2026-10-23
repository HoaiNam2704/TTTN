"use client";

import { useCallback, useEffect, useState } from "react";
import type { VideoStatus, VideoStatusUpdateDto } from "@/types/lesson";
import { useVideoStatusWs } from "./useVideoStatusWs";

export interface VideoStatusState {
  videoStatus: VideoStatus | undefined;
  hlsReady: boolean;
  playlistUrl: string | null;
  durationSeconds?: number | null;
  isWsConnected: boolean;
}

/**
 * Tracks a single lesson's video pipeline status via WebSocket.
 * Pass REST snapshot as `initial` so UI has status before the first WS push.
 * Subscribes only while status is PROCESSING (or unknown).
 */
export function useVideoStatus(
  lessonId: string | undefined,
  initial?: {
    videoStatus?: VideoStatus;
    hlsReady?: boolean;
    playlistUrl?: string | null;
    durationSeconds?: number | null;
  } | null
) {
  const [videoStatus, setVideoStatus] = useState<VideoStatus | undefined>(
    initial?.videoStatus
  );
  const [hlsReady, setHlsReady] = useState(Boolean(initial?.hlsReady));
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(
    initial?.playlistUrl ?? null
  );
  const [durationSeconds, setDurationSeconds] = useState<number | null | undefined>(
    initial?.durationSeconds
  );

  useEffect(() => {
    setVideoStatus(initial?.videoStatus);
    setHlsReady(Boolean(initial?.hlsReady));
    setPlaylistUrl(initial?.playlistUrl ?? null);
    setDurationSeconds(initial?.durationSeconds);
  }, [lessonId]);

  useEffect(() => {
    if (!initial) return;
    if (initial.videoStatus !== undefined) {
      setVideoStatus(initial.videoStatus);
    }
    if (initial.hlsReady !== undefined) {
      setHlsReady(initial.hlsReady);
    }
    if (initial.playlistUrl !== undefined) {
      setPlaylistUrl(initial.playlistUrl);
    }
    if (initial.durationSeconds !== undefined) {
      setDurationSeconds(initial.durationSeconds);
    }
  }, [
    initial?.videoStatus,
    initial?.hlsReady,
    initial?.playlistUrl,
    initial?.durationSeconds,
  ]);

  const applyUpdate = useCallback((update: VideoStatusUpdateDto) => {
    if (lessonId && update.lessonId !== lessonId) return;
    setVideoStatus(update.videoStatus);
    setHlsReady(update.hlsReady);
    setPlaylistUrl(update.playlistUrl);
    if (update.durationSeconds !== undefined) {
      setDurationSeconds(update.durationSeconds);
    }
  }, [lessonId]);

  const shouldSubscribe =
    Boolean(lessonId) &&
    (videoStatus === undefined || videoStatus === "PROCESSING");

  const { isConnected } = useVideoStatusWs(
    shouldSubscribe ? lessonId : undefined,
    applyUpdate
  );

  return {
    videoStatus,
    hlsReady,
    playlistUrl,
    durationSeconds,
    isWsConnected: isConnected,
  } satisfies VideoStatusState;
}
