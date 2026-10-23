"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Subtitles,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getActiveCue, type SubtitleCue } from "@/lib/subtitles";
import { useToast } from "@/components/ui/toast";
import Hls, { type Level } from "hls.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoPlayerProps {
  videoUrl: string;
  subtitleCues?: SubtitleCue[];
  title: string;
  onEnded?: () => void;
  onProgress?: (percent: number) => void;
  /**
   * When true (learning mode), seeking past the furthest watched point
   * resets playback to the start. Rewind within watched range is allowed.
   */
  lockSeekAhead?: boolean;
  className?: string;
}

interface QualityOption {
  /** HLS level index, or -1 for Auto */
  level: number;
  label: string;
  height?: number;
}

type SettingsPanel = "quality" | "speed" | null;

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const AUTO_QUALITY: QualityOption = { level: -1, label: "Auto" };
/** Tolerance for HLS/buffer time jumps before treating as illegal seek. */
const SEEK_AHEAD_TOLERANCE_SEC = 1.25;
/** Avoid spamming toasts when user keeps dragging the scrubber. */
const SEEK_BLOCKED_TOAST_COOLDOWN_MS = 2500;
/** Beige accent for player controls (progress, active states). */
const PLAYER_BEIGE = "#D4C4A8";
const PLAYER_BEIGE_HOVER = "#E0D2BA";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function qualityLabelFromLevel(level: Level): string {
  if (level.height) return `${level.height}p`;
  if (level.bitrate) return `${Math.round(level.bitrate / 1000)} kbps`;
  return "Unknown";
}

function buildQualityOptions(levels: Level[]): QualityOption[] {
  const sorted = levels
    .map((level, index) => ({
      level: index,
      label: qualityLabelFromLevel(level),
      height: level.height || 0,
    }))
    .sort((a, b) => b.height - a.height);

  return [AUTO_QUALITY, ...sorted];
}

// ─── VideoPlayer ──────────────────────────────────────────────────────────────

export function VideoPlayer({
  videoUrl,
  subtitleCues = [],
  title,
  onEnded,
  onProgress,
  lockSeekAhead = false,
  className,
}: VideoPlayerProps) {
  const { addToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressReportedRef = useRef(false);
  const qualitySwitchingRef = useRef(false);
  const maxWatchedRef = useRef(0);
  const enforcingResetRef = useRef(false);
  const lastSeekBlockedToastAtRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>(null);
  const [subtitlesOn, setSubtitlesOn] = useState(subtitleCues.length > 0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [activeCueText, setActiveCueText] = useState<string | null>(null);
  const [qualities, setQualities] = useState<QualityOption[]>([AUTO_QUALITY]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [activeHeight, setActiveHeight] = useState<number | null>(null);
  const [maxWatched, setMaxWatched] = useState(0);

  const hasSubtitles = subtitleCues.length > 0;
  const hasQualityChoice = qualities.length > 1;

  const selectedQualityLabel =
    qualities.find((q) => q.level === selectedQuality)?.label ?? AUTO_QUALITY.label;

  const closeSettings = useCallback(() => setSettingsPanel(null), []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setSettingsPanel(null);
      }
    }, 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      await container.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const notifySeekBlocked = useCallback(() => {
    const now = Date.now();
    if (now - lastSeekBlockedToastAtRef.current < SEEK_BLOCKED_TOAST_COOLDOWN_MS) {
      return;
    }
    lastSeekBlockedToastAtRef.current = now;
    addToast({
      type: "warning",
      message:
        "Keep watching to complete the lesson.",
      duration: 3500,
    });
  }, [addToast]);

  const resetToStart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    enforcingResetRef.current = true;
    maxWatchedRef.current = 0;
    setMaxWatched(0);
    video.currentTime = 0;
    setCurrentTime(0);
    // Allow a short window so the seeked event from this reset is ignored.
    window.setTimeout(() => {
      enforcingResetRef.current = false;
    }, 400);
  }, []);

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(time)) return;
      const clamped = Math.max(0, Math.min(time, video.duration || 0));

      if (lockSeekAhead && clamped > maxWatchedRef.current + SEEK_AHEAD_TOLERANCE_SEC) {
        notifySeekBlocked();
        resetToStart();
        return;
      }

      video.currentTime = clamped;
    },
    [lockSeekAhead, notifySeekBlocked, resetToStart]
  );

  const skip = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      seek(video.currentTime + delta);
    },
    [seek]
  );

  const toggleSubtitles = useCallback(() => {
    setSubtitlesOn((prev) => !prev);
  }, []);

  const changeSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackRate(speed);
    setSettingsPanel(null);
  }, []);

  const changeQuality = useCallback((level: number) => {
    const hls = hlsRef.current;
    if (!hls) return;

    // nextLevel switches at the next fragment — avoids buffer flush / freeze
    // that currentLevel causes (immediateLevelSwitch).
    qualitySwitchingRef.current = true;
    hls.nextLevel = level;
    setSelectedQuality(level);
    setSettingsPanel(null);

    window.setTimeout(() => {
      qualitySwitchingRef.current = false;
    }, 1500);
  }, []);

  // Sync subtitle track visibility
  useEffect(() => {
    if (!subtitlesOn || subtitleCues.length === 0) {
      setActiveCueText(null);
      return;
    }
    const cue = getActiveCue(subtitleCues, currentTime);
    setActiveCueText(cue?.text ?? null);
  }, [subtitlesOn, subtitleCues, currentTime]);

  // Attach media source (HLS with Bearer auth, or plain progressive URL)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setQualities([AUTO_QUALITY]);
    setSelectedQuality(-1);
    setActiveHeight(null);
    hlsRef.current = null;

    const isHls = videoUrl.includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        // Keep a modest buffer so nextLevel can switch sooner without
        // holding onto a long stretch of the old quality.
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        xhrSetup: (xhr) => {
          if (typeof window === "undefined") return;
          const token = localStorage.getItem("accessToken");
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
        },
      });

      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setQualities(buildQualityOptions(hls.levels));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const level = hls.levels[data.level];
        setActiveHeight(level?.height ?? null);
        qualitySwitchingRef.current = false;
        setIsBuffering(false);
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    video.src = videoUrl;
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [videoUrl]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const onTimeUpdate = () => {
      if (enforcingResetRef.current) return;
      const t = video.currentTime;
      setCurrentTime(t);

      if (lockSeekAhead) {
        // Natural playback advances max watched continuously.
        if (t > maxWatchedRef.current) {
          maxWatchedRef.current = t;
          setMaxWatched(t);
        }
      }

      if (onProgress && video.duration > 0) {
        const pct = (t / video.duration) * 100;
        if (pct >= 90 && !progressReportedRef.current) {
          progressReportedRef.current = true;
          onProgress(pct);
        }
      }
    };
    const onSeeking = () => {
      if (!lockSeekAhead || enforcingResetRef.current) return;
      if (video.currentTime > maxWatchedRef.current + SEEK_AHEAD_TOLERANCE_SEC) {
        notifySeekBlocked();
        resetToStart();
      }
    };
    const onLoadedMetadata = () => setDuration(video.duration);
    const onWaiting = () => {
      // Ignore brief stalls from quality switches — currentLevel used to
      // flush the buffer and flash the spinner; nextLevel is smoother but
      // can still emit a short waiting event.
      if (qualitySwitchingRef.current) return;
      setIsBuffering(true);
    };
    const onCanPlay = () => setIsBuffering(false);
    const onVideoEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
      if (video.duration > 0) {
        maxWatchedRef.current = video.duration;
        setMaxWatched(video.duration);
      }
      onEnded?.();
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("ended", onVideoEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("ended", onVideoEnded);
    };
  }, [onEnded, onProgress, videoUrl, lockSeekAhead, notifySeekBlocked, resetToStart]);

  // Reset watch state when the video source changes (not on subtitle cue identity).
  useEffect(() => {
    progressReportedRef.current = false;
    maxWatchedRef.current = 0;
    setMaxWatched(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setSettingsPanel(null);
  }, [videoUrl]);

  useEffect(() => {
    setSubtitlesOn(subtitleCues.length > 0);
    setActiveCueText(null);
  }, [videoUrl, subtitleCues.length]);

  // Fullscreen change
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => {
            const next = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => {
            const next = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          void toggleFullscreen();
          break;
        case "c":
          if (hasSubtitles) toggleSubtitles();
          break;
        case "Escape":
          closeSettings();
          break;
      }
      resetHideTimer();
    },
    [
      togglePlay,
      skip,
      toggleMute,
      toggleFullscreen,
      toggleSubtitles,
      hasSubtitles,
      resetHideTimer,
      closeSettings,
    ]
  );

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const watchedPercent =
    lockSeekAhead && duration > 0 ? (maxWatched / duration) * 100 : progressPercent;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full bg-black select-none overflow-hidden",
        className
      )}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={`Video player: ${title}`}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video bg-black"
        playsInline
        onClick={togglePlay}
        aria-label={title}
      />

      {subtitlesOn && activeCueText && (
        <div
          className="absolute inset-x-0 bottom-16 sm:bottom-20 flex justify-center px-6 pointer-events-none z-10"
          aria-live="polite"
        >
          <p className="max-w-[90%] rounded-md bg-black/75 px-3 py-1.5 text-center text-sm sm:text-base font-medium text-white leading-snug shadow-lg">
            {activeCueText}
          </p>
        </div>
      )}

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="h-12 w-12 rounded-full border-4 border-white/20 animate-spin"
            style={{ borderTopColor: PLAYER_BEIGE }}
          />
        </div>
      )}

      {!isPlaying && !isBuffering && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
          aria-label="Play video"
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full shadow-xl hover:scale-105 transition-transform duration-200"
            style={{ backgroundColor: PLAYER_BEIGE }}
          >
            <Play className="h-7 w-7 fill-stone-900 text-stone-900 ml-1" />
          </span>
        </button>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-3 px-4 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="relative h-1.5 w-full cursor-pointer group/progress mb-3"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            seek(ratio * duration);
          }}
          role="slider"
          aria-label={
            lockSeekAhead
              ? "Video progress (cannot seek past watched portion)"
              : "Video progress"
          }
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div className="absolute inset-0 rounded-full bg-white/25" />
          {lockSeekAhead && (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/40"
              style={{ width: `${watchedPercent}%` }}
              aria-hidden
            />
          )}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${progressPercent}%`, backgroundColor: PLAYER_BEIGE }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{
              left: `calc(${progressPercent}% - 7px)`,
              backgroundColor: PLAYER_BEIGE_HOVER,
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => skip(-10)}
            className="p-1.5 text-[#D4C4A8] hover:text-[#E0D2BA] transition-colors"
            aria-label="Rewind 10 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="p-1.5 text-[#D4C4A8] hover:text-[#E0D2BA] transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skip(10)}
            className="p-1.5 text-[#D4C4A8] hover:text-[#E0D2BA] transition-colors"
            aria-label={
              lockSeekAhead
                ? "Seek forward (seeking past watched portion restarts the lesson)"
                : "Forward 10 seconds"
            }
            title={
              lockSeekAhead
                ? "You cannot seek past the watched portion. Seeking ahead will restart the video."
                : undefined
            }
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 text-[#D4C4A8] hover:text-[#E0D2BA] transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (videoRef.current) {
                  videoRef.current.volume = v;
                  videoRef.current.muted = v === 0;
                }
                setIsMuted(v === 0);
              }}
              className="w-16 h-1 accent-[#D4C4A8] cursor-pointer hidden sm:block"
              aria-label="Volume"
            />
          </div>

          <span className="text-xs text-[#D4C4A8]/90 tabular-nums ml-1">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {hasSubtitles && (
            <button
              type="button"
              onClick={toggleSubtitles}
              className={cn(
                "p-1.5 transition-colors",
                subtitlesOn
                  ? "text-[#E0D2BA]"
                  : "text-[#D4C4A8]/80 hover:text-[#E0D2BA]"
              )}
              aria-label={subtitlesOn ? "Turn off subtitles" : "Turn on subtitles"}
              aria-pressed={subtitlesOn}
            >
              <Subtitles className="h-4 w-4" />
            </button>
          )}

          {/* Quality */}
          {hasQualityChoice && (
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setSettingsPanel((panel) =>
                    panel === "quality" ? null : "quality"
                  )
                }
                className="p-1.5 text-[#D4C4A8] hover:text-[#E0D2BA] transition-colors text-xs font-semibold"
                aria-label="Quality"
                aria-expanded={settingsPanel === "quality"}
              >
                {selectedQuality === -1 && activeHeight
                  ? `${activeHeight}p`
                  : selectedQualityLabel}
              </button>

              {settingsPanel === "quality" && (
                <div className="absolute bottom-full right-0 mb-2 min-w-[140px] rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
                  <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold text-white/70">
                    Quality
                  </div>
                  {qualities.map((option) => (
                    <button
                      key={option.level}
                      type="button"
                      onClick={() => changeQuality(option.level)}
                      className={cn(
                        "block w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-colors",
                        selectedQuality === option.level
                          ? "text-[#D4C4A8] font-bold"
                          : "text-white/80"
                      )}
                    >
                      {option.level === -1 && activeHeight
                        ? `Auto (${activeHeight}p)`
                        : option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Speed */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setSettingsPanel((panel) =>
                  panel === "speed" ? null : "speed"
                )
              }
              className="p-1.5 text-[#D4C4A8] hover:text-[#E0D2BA] transition-colors text-xs font-semibold"
              aria-label="Playback speed"
              aria-expanded={settingsPanel === "speed"}
            >
              {playbackRate}x
            </button>

            {settingsPanel === "speed" && (
              <div className="absolute bottom-full right-0 mb-2 min-w-[100px] rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
                <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold text-white/70">
                  Speed
                </div>
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => changeSpeed(speed)}
                    className={cn(
                      "block w-full px-4 py-1.5 text-left text-sm hover:bg-white/10 transition-colors",
                      playbackRate === speed
                        ? "text-[#D4C4A8] font-bold"
                        : "text-white/80"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="p-1.5 text-[#D4C4A8] hover:text-[#E0D2BA] transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
