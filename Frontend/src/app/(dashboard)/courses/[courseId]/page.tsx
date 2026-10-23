"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  Play,
  CheckCircle2,
  Users,
  Calendar,
  Globe,
} from "lucide-react";
import { courseService } from "@/services/course.service";
import { CurriculumAccordion } from "@/components/course/CurriculumAccordion";
import { VideoPreviewModal } from "@/components/course/VideoPreviewModal";
import { EnrollmentCTA } from "@/components/course/EnrollmentCTA";
import {
  CourseRatingBadge,
  CourseReviews,
} from "@/components/course/CourseReviews";
import { ROUTES } from "@/constants/routes";
import { formatDuration, sumSectionDuration } from "@/lib/formatDuration";
import type { CourseDetailResponseDto } from "@/types/course";
import type { LessonResponseDto } from "@/types/lesson";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { IconBook } from "@/components/common/icons";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTotalStats(data: CourseDetailResponseDto) {
  const totalLessons = data.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const allLessons = data.sections.flatMap((s) => s.lessons);
  const totalDuration = sumSectionDuration(allLessons);
  return { totalLessons, totalSections: data.sections.length, totalDuration };
}

const COVER_PALETTES = [
  "bg-zinc-900",
  "bg-zinc-800",
  "bg-neutral-800",
  "bg-stone-800",
  "bg-slate-800",
  "bg-zinc-700",
];

function getCourseCover(id: string): string {
  const idx =
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    COVER_PALETTES.length;
  return COVER_PALETTES[idx];
}

// ─── Mock Data generator for trust and conversion ─────────────────────────────

function getCourseMockData(courseId: string) {
  const hash = courseId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const instructors = [
    {
      name: "Dr. Nguyen Tran Minh",
      title: "Cloud & DevOps Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      bio: "Former senior solutions engineer at AWS with over 10 years of experience deploying large-scale infrastructure. Passionate about teaching containerization, Kubernetes, and infrastructure automation to the next generation of engineers.",
      students: "15,400+",
      courses: 4,
      rating: "4.8"
    },
    {
      name: "M.Sc. Pham Hoang Nam",
      title: "DevOps Tech Lead at VNG Corporation",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
      bio: "Expert in CI/CD and microservices architecture. Has led many large infrastructure projects with outstanding performance, serving millions of concurrent users. Distinguished instructor at leading technology centers.",
      students: "8,900+",
      courses: 3,
      rating: "4.9"
    }
  ];
  
  const outcomesList = [
    [
      "Build complete automated CI/CD pipelines from source code to production.",
      "Master Docker containerization to package applications professionally.",
      "Deploy, monitor, and manage enterprise-grade Kubernetes (K8s) clusters.",
      "Automate infrastructure management (IaC) with Terraform."
    ],
    [
      "Set up secure, cost-optimized CI/CD architectures on cloud infrastructure.",
      "Monitor systems in real time with Prometheus & Grafana.",
      "Administer Linux systems in depth for cloud infrastructure operations.",
      "Solve common microservices challenges and optimize application performance."
    ]
  ];

  const instructorIdx = hash % instructors.length;
  const updatedMonth = 1 + (hash % 12);
  const updatedYear = 2025 + (hash % 2);

  return {
    instructor: instructors[instructorIdx],
    lastUpdated: `Last updated: ${updatedMonth.toString().padStart(2, "0")}/${updatedYear}`,
    outcomes: outcomesList[hash % outcomesList.length],
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CourseDetailSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading course…">
      <div className="bg-[#E8DFD0] px-6 py-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="h-3 w-48 rounded bg-stone-400/30 mb-6" />
          <div className="h-10 w-2/3 rounded bg-stone-400/30 mb-3" />
          <div className="h-6 w-1/2 rounded bg-stone-400/30 mb-6" />
        </div>
      </div>
      <div className="bg-muted min-h-screen">
        <div className="mx-auto max-w-[1200px] px-4 py-10 lg:px-6">
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex-1 space-y-6">
              <div className="rounded-2xl bg-white p-6 space-y-3">
                <div className="h-5 w-36 rounded bg-gray-200" />
                {[1, 2, 3].map((i) => <div key={i} className="h-4 w-full rounded bg-gray-200" />)}
              </div>
            </div>
            <div className="w-full shrink-0 lg:w-72 xl:w-80 space-y-4">
              <div className="h-48 rounded-xl bg-gray-200" />
              <div className="h-12 rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Error Card ───────────────────────────────────────────────────────────────

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-[#141414]">
        Could not load course
      </h2>
      <p className="mt-2 text-sm text-[#666]">{message}</p>
      <Link
        href={ROUTES.DASHBOARD}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

// ─── Sidebar Card ─────────────────────────────────────────────────────────────

function SidebarCard({
  data,
  hasThumbnail,
  onImgError,
  onPreviewClick,
  totalLessons,
  totalDuration,
  hasPlayablePreview,
}: {
  data: CourseDetailResponseDto;
  hasThumbnail: boolean;
  onImgError: () => void;
  onPreviewClick: () => void;
  totalLessons: number;
  totalDuration: number | null;
  hasPlayablePreview: boolean;
}) {
  return (
    <div className="rounded-xl bg-white shadow-xl overflow-hidden border border-stone-200/80">
      {/* Thumbnail */}
      <div className="relative h-40 bg-stone-100">
        {hasThumbnail ? (
          <Image
            src={data.thumbnailPresignedUrl!}
            alt={data.title}
            fill
            className="object-cover"
            sizes="360px"
            onError={onImgError}
            priority
          />
        ) : (
          <div className={`h-full w-full ${getCourseCover(data.courseId)} flex items-center justify-center`}>
            <IconBook className="h-12 w-12 text-white/30" />
          </div>
        )}
        {hasPlayablePreview && (
          <button
            type="button"
            onClick={onPreviewClick}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group cursor-pointer"
            aria-label="Watch preview"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-lg group-hover:scale-105 transition-all">
              <Play className="h-5 w-5 fill-primary text-primary ml-0.5" />
            </span>
          </button>
        )}
      </div>

      {/* CTA + info */}
      <div className="p-5">
        <EnrollmentCTA courseId={data.courseId} isEnrolled={data.isEnrolled} variant="sidebar" />

        <div className="mt-5 pt-4 border-t border-stone-100">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">This course includes:</p>
          <ul className="space-y-2.5 text-[13px] text-stone-600">
            {totalDuration !== null && (
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-stone-400" />
                <span>{formatDuration(totalDuration)} of video content</span>
              </li>
            )}
            <li className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 shrink-0 text-stone-400" />
              <span>{totalLessons} in-depth lessons</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Award className="h-4 w-4 shrink-0 text-stone-400" />
              <span>Completion certificate from ITIS</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-stone-400" />
              <span>Lifetime access</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const [selectedLesson, setSelectedLesson] =
    useState<LessonResponseDto | null>(null);
  const [imgError, setImgError] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["course-curriculum", courseId],
    queryFn: () => courseService.getCourseCurriculum(courseId),
    enabled: !!courseId,
  });

  if (isLoading) return <CourseDetailSkeleton />;

  if (isError || !data) {
    const msg =
      error instanceof Error
        ? error.message
        : "An error occurred while loading the course. Please try again.";
    return <ErrorCard message={msg} />;
  }

  const hasThumbnail =
    !imgError &&
    typeof data.thumbnailPresignedUrl === "string" &&
    data.thumbnailPresignedUrl.length > 0;

  const { totalLessons, totalSections, totalDuration } = getTotalStats(data);
  const mock = getCourseMockData(data.courseId);

  const firstPreviewLesson =
    data.sections
      .flatMap((s) => s.lessons)
      .find((l) => l.isPreview && (l.videoStatus === "READY" || l.videoStatus === undefined)) ??
    null;

  const hasPlayablePreview = Boolean(firstPreviewLesson);

  return (
    <>
      <DashboardHeader />
      
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#E8DFD0] border-b border-[#D6CBBA] text-stone-900">
        <div className="mx-auto max-w-[1200px] px-4 py-10 lg:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

            {/* Left: text meta */}
            <div className="flex-1 min-w-0 pr-0 lg:pr-8">
              {/* Breadcrumb */}
              <nav className="mb-4 flex items-center gap-1.5 text-xs text-stone-500" aria-label="Breadcrumb">
                <Link href={ROUTES.DASHBOARD} className="hover:text-stone-800 transition-colors">
                  Courses
                </Link>
                <ChevronRight className="h-3 w-3 text-stone-400" />
                <span className="text-stone-600 line-clamp-1">{data.title}</span>
              </nav>

              {/* Title */}
              <h1 className="text-3xl font-extrabold leading-tight text-stone-900 sm:text-4xl tracking-tight">
                {data.title}
              </h1>

              {/* Description */}
              {data.description && (
                <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-stone-600">
                  {data.description}
                </p>
              )}

              {/* Metadata row */}
              <div className="mt-6 flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-stone-700">
                <CourseRatingBadge courseId={courseId} />

                {/* Students Count */}
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-stone-500" />
                  <span>
                    <strong>
                      {(data.enrollmentCount ?? 0).toLocaleString("en-US")}
                    </strong>{" "}
                    students
                  </span>
                </div>

                {/* Duration/Lectures */}
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-stone-500" />
                  <span>{totalSections} sections · {totalLessons} lessons</span>
                </div>
              </div>

              {/* Bottom metadata */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {mock.lastUpdated}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Vietnamese
                </span>
              </div>

            </div>

            {/* Right: Spacer for desktop card overlapping */}
            <div className="hidden lg:block w-72 xl:w-[280px] shrink-0" />
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div className="bg-muted min-h-screen">
        <div className="mx-auto max-w-[1200px] px-4 py-10 lg:px-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

            {/* ── Left / Main ─────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-8">

              {/* Description block */}
              {data.description && (
                <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-stone-850 mb-3">
                    Course description
                  </h2>
                  <p className="text-[14px] leading-relaxed text-stone-600">
                    {data.description}
                  </p>
                </section>
              )}

              {/* Curriculum */}
              {data.sections.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-bold text-stone-850">
                    Course content
                  </h2>
                  <CurriculumAccordion
                    courseId={courseId}
                    sections={data.sections}
                    isEnrolled={data.isEnrolled}
                    completedLessonIds={data.completedLessonIds}
                    onPreviewClick={setSelectedLesson}
                    maxVisibleSections={5}
                  />
                </section>
              )}

              <CourseReviews courseId={courseId} isEnrolled={data.isEnrolled} />

            </div>

            {/* ── Right / Sidebar (mobile card below hero + desktop sticky) ─ */}
            <aside className="w-full shrink-0 lg:hidden">
              <SidebarCard
                data={data}
                hasThumbnail={hasThumbnail}
                onImgError={() => setImgError(true)}
                onPreviewClick={() => setSelectedLesson(firstPreviewLesson)}
                totalLessons={totalLessons}
                totalDuration={totalDuration}
                hasPlayablePreview={hasPlayablePreview}
              />
            </aside>

            <aside className="hidden lg:block w-72 xl:w-[280px] shrink-0 sticky top-24 z-10 lg:-mt-[220px]">
              <SidebarCard
                data={data}
                hasThumbnail={hasThumbnail}
                onImgError={() => setImgError(true)}
                onPreviewClick={() => setSelectedLesson(firstPreviewLesson)}
                totalLessons={totalLessons}
                totalDuration={totalDuration}
                hasPlayablePreview={hasPlayablePreview}
              />
            </aside>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="border-t border-[#e0ddd9] bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div>
              <p className="font-bold text-stone-800 text-sm">ITIS ACADEMY</p>
              <p className="mt-0.5">
                © {new Date().getFullYear()} ITIS Academy. Professional learning platform.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
      />
    </>
  );
}
