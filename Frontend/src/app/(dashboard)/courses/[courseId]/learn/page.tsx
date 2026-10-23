"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/services/course.service";
import { getFirstAccessibleLesson } from "@/lib/curriculum";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";

export default function LearnRedirectPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const courseId = params.courseId;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["course-curriculum", courseId],
    queryFn: () => courseService.getCourseCurriculum(courseId),
    enabled: !!courseId && isAuthenticated,
  });

  useEffect(() => {
    if (authLoading) return; // Wait for auth to hydrate from localStorage
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (isLoading || !data) return;

    const first = getFirstAccessibleLesson(data);
    if (first) {
      router.replace(`/courses/${courseId}/learn/${first.id}`);
    } else {
      router.replace(`/courses/${courseId}`);
    }
  }, [authLoading, isAuthenticated, isLoading, data, courseId, router]);

  if (isError) {
    router.replace(`/courses/${courseId}`);
    return null;
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#1c1d1f]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-[#18181b] animate-spin" />
        <p className="text-sm text-white/60">Loading lesson…</p>
      </div>
    </div>
  );
}
