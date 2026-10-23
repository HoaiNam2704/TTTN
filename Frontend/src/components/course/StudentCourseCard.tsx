import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Clock,
  Play,
  Star,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { CourseLevel, CourseResponseDto } from "@/types/course";

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const LEVEL_BADGE: Record<CourseLevel, "success" | "warning" | "danger"> = {
  BEGINNER: "success",
  INTERMEDIATE: "warning",
  ADVANCED: "danger",
};

const COVER_PALETTES = [
  "bg-zinc-900",
  "bg-zinc-800",
  "bg-neutral-800",
  "bg-stone-800",
  "bg-slate-800",
  "bg-zinc-700",
];

function getCourseCover(id: string) {
  const idx =
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    COVER_PALETTES.length;
  return COVER_PALETTES[idx];
}

export interface StudentCourseCardProps {
  course: CourseResponseDto;
  /** When true, show enrolled badge */
  enrolledView?: boolean;
  /** @deprecated Progress UI removed from cards */
  progressPercent?: number | null;
  teacherName?: string;
  lessonCount?: number;
  durationLabel?: string;
  view?: "grid" | "list";
}

function CourseBadges({
  level,
  isEnrolled,
  isFree,
}: {
  level: CourseLevel;
  isEnrolled: boolean;
  isFree: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={LEVEL_BADGE[level]} className="rounded-lg">
        {LEVEL_LABELS[level]}
      </Badge>
      {isEnrolled && (
        <Badge variant="info" className="rounded-lg">
          Enrolled
        </Badge>
      )}
      {isFree && (
        <Badge variant="success" className="rounded-lg">
          Free
        </Badge>
      )}
    </div>
  );
}

export function StudentCourseCard({
  course,
  enrolledView = false,
  teacherName = "ITIS Academy",
  lessonCount,
  durationLabel,
  view = "grid",
}: StudentCourseCardProps) {
  const cover = getCourseCover(course.id);
  const level = course.level as CourseLevel;
  const isEnrolled = enrolledView || !!course.isEnrolled;
  const isFree = !course.price;
  const href = ROUTES.COURSE_DETAIL(course.id);

  if (view === "list") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
          "flex-row items-stretch",
          "transition-all duration-200 ease-out",
          "hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15",
        )}
      >
        <div className="relative w-36 shrink-0 overflow-hidden sm:w-52 md:w-64">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              sizes="256px"
            />
          ) : (
            <div
              className={cn(
                "flex h-full min-h-[140px] w-full items-center justify-center",
                cover,
              )}
            >
              <BookOpen className="h-10 w-10 text-white/30" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 px-5 py-4 text-left md:px-6 md:py-5">
          <div>
            <h3 className="text-xl font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-foreground/80">
              {course.title}
            </h3>
            {course.description && (
              <p className="mt-1.5 line-clamp-2 text-base text-muted-foreground">
                {course.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {teacherName}
            </span>
            {typeof lessonCount === "number" && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
              </span>
            )}
            {durationLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {durationLabel}
              </span>
            )}
            {typeof course.averageRating === "number" &&
              course.averageRating > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {course.averageRating.toFixed(1)}
                  {typeof course.reviewCount === "number" &&
                    course.reviewCount > 0 && (
                      <span className="text-muted-foreground/70">
                        ({course.reviewCount})
                      </span>
                    )}
                </span>
              )}
          </div>

          <CourseBadges level={level} isEnrolled={isEnrolled} isFree={isFree} />

          <span
            className={cn(
              "mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium sm:w-auto sm:self-start",
              "bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90",
            )}
          >
            {isEnrolled ? (
              <>
                <Play className="h-4 w-4" />
                Continue learning
              </>
            ) : (
              "View details"
            )}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15",
      )}
    >
      <div className="relative h-40 overflow-hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center",
              cover,
            )}
          >
            <BookOpen className="h-10 w-10 text-white/30" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div>
          <h3 className="line-clamp-2 text-xl font-semibold leading-snug tracking-tight text-foreground">
            {course.title}
          </h3>

          {course.description && (
            <p className="mt-1.5 line-clamp-2 text-base text-muted-foreground">
              {course.description}
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{teacherName}</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {typeof lessonCount === "number" && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
              </span>
            )}
            {durationLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {durationLabel}
              </span>
            )}
            {typeof course.averageRating === "number" &&
              course.averageRating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {course.averageRating.toFixed(1)}
                </span>
              )}
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-1">
          <CourseBadges level={level} isEnrolled={isEnrolled} isFree={isFree} />
          <span
            className={cn(
              "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium",
              "bg-primary text-primary-foreground transition-colors group-hover:bg-primary/90",
            )}
          >
            {isEnrolled ? (
              <>
                <Play className="h-4 w-4" />
                Continue learning
              </>
            ) : (
              "View details"
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton({ view = "grid" }: { view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="flex animate-pulse flex-row overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-[140px] w-36 shrink-0 bg-secondary sm:w-52 md:w-64" />
        <div className="flex-1 space-y-3 px-5 py-4">
          <div className="h-6 w-3/4 rounded-lg bg-secondary" />
          <div className="h-4 w-full rounded-lg bg-secondary" />
          <div className="h-4 w-1/2 rounded-lg bg-secondary" />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded-lg bg-secondary" />
            <div className="h-5 w-20 rounded-lg bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-pulse">
      <div className="h-40 bg-secondary" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-4/5 rounded-lg bg-secondary" />
        <div className="h-4 w-full rounded-lg bg-secondary" />
        <div className="h-4 w-2/3 rounded-lg bg-secondary" />
        <div className="flex gap-2 pt-2">
          <div className="h-5 w-16 rounded-lg bg-secondary" />
          <div className="h-5 w-20 rounded-lg bg-secondary" />
        </div>
      </div>
    </div>
  );
}
