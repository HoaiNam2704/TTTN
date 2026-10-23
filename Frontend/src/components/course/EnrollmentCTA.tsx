"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { enrollmentService } from "@/services/enrollment.service";
import { ROUTES } from "@/constants/routes";
import { ArrowRight } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

interface EnrollmentCTAProps {
  courseId: string;
  isEnrolled: boolean;
  /** "sidebar" (default) — full-width inside card; "hero" — inline on dark hero */
  variant?: "sidebar" | "hero";
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── EnrollmentCTA ────────────────────────────────────────────────────────────

export function EnrollmentCTA({
  courseId,
  isEnrolled: initialIsEnrolled,
  variant = "sidebar",
}: EnrollmentCTAProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [enrolled, setEnrolled] = useState(initialIsEnrolled);

  useEffect(() => {
    setEnrolled(initialIsEnrolled);
  }, [initialIsEnrolled]);

  // Guests never see "Continue learning" — even if curriculum cache still has isEnrolled.
  const showContinue = isAuthenticated && enrolled;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      enrollmentService.createEnrollment({
        courseId,
        userId: user!.userId,
      }),
    onSuccess: () => {
      setEnrolled(true);
      queryClient.invalidateQueries({ queryKey: ["course-curriculum", courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      addToast({ type: "success", message: "Successfully enrolled! Enjoy learning." });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        message: error?.message || "Enrollment failed. Please try again.",
      });
    },
  });

  const handleEnroll = () => {
    if (!isAuthenticated) {
      addToast({
        type: "warning",
        message: "Please log in to enroll in this course.",
      });
      return;
    }
    mutate();
  };

  const handleContinue = () => {
    router.push(ROUTES.COURSE_LEARN(courseId));
  };

  // ── Sidebar variant (inside white card) ────────────────────────────────────
  if (variant === "sidebar") {
    return showContinue ? (
      <button
        type="button"
        onClick={handleContinue}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border border-primary px-4 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground cursor-pointer"
        aria-label="Continue learning"
      >
        <span>Continue learning</span>
        <ArrowRight className="h-4 w-4 shrink-0" />
      </button>
    ) : (
      <button
        type="button"
        onClick={handleEnroll}
        disabled={isPending}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        aria-label="Enroll now"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2"><Spinner />Processing…</span>
        ) : (
          <>
            <span>Enroll now</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </>
        )}
      </button>
    );
  }

  // ── Hero variant (on dark background) ──────────────────────────────────────
  return showContinue ? (
    <button
      type="button"
      onClick={handleContinue}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-white px-4 text-sm font-medium text-primary transition-colors hover:bg-white/90 cursor-pointer"
      aria-label="Continue learning"
    >
      <span>Continue learning</span>
      <ArrowRight className="h-4 w-4 shrink-0" />
    </button>
  ) : (
    <button
      type="button"
      onClick={handleEnroll}
      disabled={isPending}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      aria-label="Enroll now"
    >
      {isPending ? (
        <span className="flex items-center gap-2"><Spinner />Processing…</span>
      ) : (
        <>
          <span>Enroll now</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </>
      )}
    </button>
  );
}
