"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  FileVideo,
  Captions,
  Eye,
  FolderClosed,
  MoreVertical,
  RefreshCw,
} from "lucide-react";
import { AdminHeader, AdminBreadcrumb } from "@/components/layout/admin-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { AdminInput, Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminTable, type AdminTableColumn } from "@/components/admin/admin-table";
import { ReorderDirtyBar } from "@/components/admin/reorder-dirty-bar";
import { courseService } from "@/services/course.service";
import { lessonService } from "@/services/lesson.service";
import { sectionService } from "@/services/section.service";
import { useToast } from "@/components/ui/toast";
import type { ApiError } from "@/services/api";
import { getVideoDuration } from "@/lib/formatDuration";
import { VideoPreviewModal } from "@/components/course/VideoPreviewModal";
import { useVideoStatusWs } from "@/hooks/useVideoStatusWs";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { LessonResponseDto, VideoStatusUpdateDto } from "@/types/lesson";
import type { PageResponse } from "@/types/api";

export default function SectionLessonsPage() {
  const params = useParams<{ id: string }>();
  const sectionId = params.id;
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubtitleOpen, setIsSubtitleOpen] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState<{
    id: string;
    title: string;
    description: string;
    isPreview: boolean;
    hasSubtitle?: boolean;
  } | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Pick<
    LessonResponseDto,
    "id" | "title" | "subtitleStorageKey" | "videoStatus" | "hlsReady" | "playlistUrl"
  > | null>(null);
  
  // Form fields
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [isPreviewInput, setIsPreviewInput] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [isCalculatingDuration, setIsCalculatingDuration] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);

  const wsConnectedRef = useRef(false);

  const { data: section } = useQuery({
    queryKey: ["admin-section", sectionId],
    queryFn: () => sectionService.getSectionById(sectionId),
    enabled: !!sectionId,
  });

  const courseId = section?.courseId || searchParams.get("courseId") || "";
  const sectionTitle = section?.title?.trim() || "Section";

  const { data: course } = useQuery({
    queryKey: ["admin-course", courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: !!courseId,
  });

  const courseTitle = course?.title?.trim() || "Course";

  const { data: lessonsPage, isLoading } = useQuery({
    queryKey: ["admin-lessons", sectionId],
    queryFn: () => lessonService.getLessons({ sectionId, size: 100 }),
    enabled: !!sectionId,
    refetchInterval: (query) => {
      const hasProcessing = (query.state.data?.content ?? []).some(
        (l) => l.videoStatus === "PROCESSING"
      );
      if (!hasProcessing) return false;
      // Prefer WS; poll only when disconnected
      return wsConnectedRef.current ? false : 5000;
    },
  });

  const lessons = useMemo(() => lessonsPage?.content ?? [], [lessonsPage]);

  const [orderedLessons, setOrderedLessons] = useState<LessonResponseDto[]>([]);

  useEffect(() => {
    setOrderedLessons((prev) => {
      if (prev.length === 0) return lessons;

      const sameIds =
        prev.length === lessons.length &&
        lessons.every((les) => prev.some((item) => item.id === les.id));

      if (!sameIds) return lessons;

      const matchesServerOrder = prev.every((les, index) => les.id === lessons[index]?.id);
      if (matchesServerOrder) return lessons;

      return prev.map((local) => lessons.find((les) => les.id === local.id) ?? local);
    });
  }, [lessons]);

  const isOrderDirty = useMemo(() => {
    if (lessons.length < 2 || orderedLessons.length !== lessons.length) return false;
    return orderedLessons.some((les, index) => les.id !== lessons[index]?.id);
  }, [orderedLessons, lessons]);

  const processingLessonIds = useMemo(
    () => orderedLessons.filter((l) => l.videoStatus === "PROCESSING").map((l) => l.id),
    [orderedLessons]
  );

  const applyVideoStatusUpdate = useCallback(
    (update: VideoStatusUpdateDto) => {
      queryClient.setQueryData<PageResponse<LessonResponseDto>>(
        ["admin-lessons", sectionId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((lesson) =>
              lesson.id === update.lessonId
                ? {
                    ...lesson,
                    videoStatus: update.videoStatus,
                    hlsReady: update.hlsReady,
                    playlistUrl: update.playlistUrl,
                    durationSeconds:
                      update.durationSeconds !== undefined &&
                      update.durationSeconds !== null
                        ? update.durationSeconds
                        : lesson.durationSeconds,
                  }
                : lesson
            ),
          };
        }
      );

      if (update.videoStatus === "READY") {
        addToast({
          type: "success",
          message: "Video is ready for preview.",
        });
      } else if (update.videoStatus === "ERROR") {
        addToast({
          type: "error",
          message: "Video processing failed. You can try reprocessing.",
        });
      }
    },
    [addToast, queryClient, sectionId]
  );

  const { isConnected: isVideoWsConnected } = useVideoStatusWs(
    processingLessonIds,
    applyVideoStatusUpdate
  );
  wsConnectedRef.current = isVideoWsConnected;


  const isSearching = debouncedSearchQuery.trim().length > 0;

  const filteredLessons = useMemo(() => {
    if (!isSearching) return orderedLessons;
    return orderedLessons.filter((les) =>
      les.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [orderedLessons, debouncedSearchQuery, isSearching]);

  // CREATE Mutation — video via POST
  const createMutation = useMutation({
    mutationFn: async (data: {
      sectionId: string;
      title: string;
      description?: string;
      video: File;
      isPreview?: boolean;
      durationSeconds?: number;
    }) => {
      return lessonService.createLesson(
        {
          sectionId: data.sectionId,
          title: data.title,
          description: data.description,
          video: data.video,
          isPreview: data.isPreview,
          durationSeconds: data.durationSeconds,
        },
        (percent) => setUploadProgress(percent)
      );
    },
    onSuccess: () => {
      addToast({ type: "success", message: "Lesson added successfully!" });
      void queryClient.invalidateQueries({ queryKey: ["admin-lessons", sectionId] });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "An error occurred while creating the lesson.",
      });
    },
  });

  // UPDATE Mutation — multipart metadata (+ optional video)
  const updateMutation = useMutation({
    mutationFn: async (data: {
      lessonId: string;
      title: string;
      description?: string;
      isPreview?: boolean;
      video?: File | null;
      durationSeconds?: number;
    }) => {
      return lessonService.updateLesson(
        data.lessonId,
        {
          title: data.title,
          description: data.description,
          isPreview: data.isPreview,
          video: data.video,
          durationSeconds: data.durationSeconds,
        },
        data.video ? (percent) => setUploadProgress(percent) : undefined
      );
    },
    onSuccess: () => {
      addToast({ type: "success", message: "Lesson updated successfully!" });
      void queryClient.invalidateQueries({ queryKey: ["admin-lessons", sectionId] });
      setIsEditOpen(false);
      setSelectedLesson(null);
      resetForm();
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "An error occurred while updating the lesson.",
      });
    },
  });

  // SUBTITLE Mutation — dedicated upload/replace
  const subtitleMutation = useMutation({
    mutationFn: async (data: { lessonId: string; subtitle: File }) => {
      return lessonService.uploadSubtitle(data.lessonId, data.subtitle);
    },
    onSuccess: () => {
      addToast({ type: "success", message: "Subtitle updated successfully!" });
      void queryClient.invalidateQueries({ queryKey: ["admin-lessons", sectionId] });
      setIsSubtitleOpen(false);
      setSelectedLesson(null);
      resetForm();
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "An error occurred while uploading the subtitle.",
      });
    },
  });

  // DELETE Mutation
  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => lessonService.deleteLesson(lessonId),
    onSuccess: () => {
      addToast({ type: "success", message: "Lesson deleted successfully!" });
      void queryClient.invalidateQueries({ queryKey: ["admin-lessons", sectionId] });
      setIsDeleteOpen(false);
      setSelectedLesson(null);
    },
    onError: (err) => {
      addToast({ type: "error", message: (err as ApiError)?.message || "Unable to delete this lesson." });
      setIsDeleteOpen(false);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (lessonIds: string[]) =>
      lessonService.reorderLessons(sectionId, { lessonIds }),
    onSuccess: async (_data, lessonIds) => {
      addToast({ type: "success", message: "Lesson order saved!" });
      queryClient.setQueryData<PageResponse<LessonResponseDto>>(
        ["admin-lessons", sectionId],
        (old) => {
          if (!old) return old;
          const byId = new Map(old.content.map((les) => [les.id, les]));
          return {
            ...old,
            content: lessonIds.flatMap((id, index) => {
              const les = byId.get(id);
              return les ? [{ ...les, sortOrder: index + 1 }] : [];
            }),
          };
        }
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-lessons", sectionId] });
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "Unable to save lesson order.",
      });
    },
  });

  // REQUEUE Mutation
  const requeueMutation = useMutation({
    mutationFn: (lessonId: string) => lessonService.requeueTranscode(lessonId),
    onSuccess: (lesson) => {
      addToast({ type: "success", message: "Video reprocess request sent!" });
      queryClient.setQueryData<PageResponse<LessonResponseDto>>(
        ["admin-lessons", sectionId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((l) => (l.id === lesson.id ? { ...l, ...lesson } : l)),
          };
        }
      );
    },
    onError: (err) => {
      addToast({ type: "error", message: (err as ApiError)?.message || "Unable to reprocess video." });
    },
  });

  const resetForm = () => {
    setTitleInput("");
    setDescriptionInput("");
    setIsPreviewInput(false);
    setVideoFile(null);
    setSubtitleFile(null);
    setUploadProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (subtitleInputRef.current) subtitleInputRef.current.value = "";
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadProgress(0);
    if (!titleInput.trim()) {
      addToast({ type: "warning", message: "Lesson title cannot be empty." });
      return;
    }
    if (titleInput.trim().length < 10) {
      addToast({ type: "warning", message: "Lesson title must be at least 10 characters." });
      return;
    }
    if (!videoFile) {
      addToast({ type: "warning", message: "Please select a lesson video file." });
      return;
    }

    let duration: number | undefined = undefined;
    setIsCalculatingDuration(true);
    try {
      duration = await getVideoDuration(videoFile);
    } catch (err) {
      console.error("Error calculating video duration:", err);
    } finally {
      setIsCalculatingDuration(false);
    }

    createMutation.mutate({
      sectionId,
      title: titleInput.trim(),
      description: descriptionInput.trim() || undefined,
      video: videoFile,
      isPreview: isPreviewInput,
      durationSeconds: duration,
    });
  };

  const handleOpenEdit = (les: LessonResponseDto) => {
    resetForm();
    setSelectedLesson({
      id: les.id,
      title: les.title,
      description: les.description || "",
      isPreview: !!les.isPreview,
    });
    setTitleInput(les.title);
    setDescriptionInput(les.description || "");
    setIsPreviewInput(!!les.isPreview);
    setIsEditOpen(true);
  };

  const handleOpenSubtitle = (les: LessonResponseDto) => {
    resetForm();
    setSelectedLesson({
      id: les.id,
      title: les.title,
      description: les.description || "",
      isPreview: !!les.isPreview,
      hasSubtitle: Boolean(les.subtitleStorageKey),
    });
    setIsSubtitleOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadProgress(0);
    if (!selectedLesson) return;
    if (!titleInput.trim()) {
      addToast({ type: "warning", message: "Lesson title cannot be empty." });
      return;
    }
    if (titleInput.trim().length < 10) {
      addToast({ type: "warning", message: "Lesson title must be at least 10 characters." });
      return;
    }

    let duration: number | undefined = undefined;
    if (videoFile) {
      setIsCalculatingDuration(true);
      try {
        duration = await getVideoDuration(videoFile);
      } catch (err) {
        console.error("Error calculating video duration:", err);
      } finally {
        setIsCalculatingDuration(false);
      }
    }

    updateMutation.mutate({
      lessonId: selectedLesson.id,
      title: titleInput.trim(),
      description: descriptionInput.trim() || undefined,
      isPreview: isPreviewInput,
      video: videoFile,
      durationSeconds: duration,
    });
  };

  const handleUploadSubtitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;
    if (!subtitleFile) {
      addToast({ type: "warning", message: "Please select a subtitle file (.vtt, .srt)." });
      return;
    }
    subtitleMutation.mutate({
      lessonId: selectedLesson.id,
      subtitle: subtitleFile,
    });
  };

  const handleOpenDelete = (les: LessonResponseDto) => {
    setSelectedLesson({ id: les.id, title: les.title, description: "", isPreview: false });
    setIsDeleteOpen(true);
  };

  const handleOpenPreview = (les: LessonResponseDto) => {
    if (les.videoStatus !== "READY") return;
    setPreviewLesson({
      id: les.id,
      title: les.title,
      subtitleStorageKey: les.subtitleStorageKey,
      videoStatus: les.videoStatus,
      hlsReady: les.hlsReady,
      playlistUrl: les.playlistUrl,
    });
  };

  const handleDelete = () => {
    if (!selectedLesson) return;
    deleteMutation.mutate(selectedLesson.id);
  };

  const handleReorder = (activeId: string, overId: string) => {
    setOrderedLessons((items) => {
      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === overId);
      if (oldIndex < 0 || newIndex < 0) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleDiscardReorder = () => {
    setOrderedLessons(lessons);
  };

  const handleSubmitReorder = async () => {
    if (orderedLessons.length < 2) {
      addToast({
        type: "warning",
        message: "At least 2 lessons are required to reorder.",
      });
      return;
    }
    await reorderMutation.mutateAsync(orderedLessons.map((les) => les.id));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const overlayPlaceholder = () => <span className="text-xs text-stone-400">—</span>;

  const columns: AdminTableColumn<LessonResponseDto>[] = [
    {
      key: "lesson",
      header: "Lesson",
      width: 360,
      minWidth: 200,
      headerClassName: "min-w-0",
      cellClassName: "min-w-0 px-5 py-3.5 align-middle",
      cell: (les) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600">
            <Video className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-stone-850">{les.title}</span>
            <span className="mt-0.5 line-clamp-1 text-xs text-stone-400">
              {les.description || "No detailed lesson description yet."}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      width: 112,
      minWidth: 88,
      headerClassName: "px-3 text-center",
      cellClassName:
        "px-3 py-3.5 text-center align-middle font-medium tabular-nums text-stone-600",
      cell: (les) => formatDuration(les.durationSeconds ?? null),
    },
    {
      key: "subtitle",
      header: "Subtitle",
      width: 112,
      minWidth: 88,
      headerClassName: "px-3 text-center",
      cellClassName: "px-3 py-3.5 text-center align-middle",
      overlayCell: overlayPlaceholder,
      cell: (les) =>
        les.subtitleStorageKey ? (
          <Badge variant="success" className="rounded px-2 font-medium">
            Available
          </Badge>
        ) : (
          <Badge variant="warning" className="rounded px-2 font-medium">
            Missing
          </Badge>
        ),
    },
    {
      key: "preview",
      header: "Free preview",
      width: 112,
      minWidth: 88,
      headerClassName: "px-3 text-center",
      cellClassName: "px-3 py-3.5 text-center align-middle",
      overlayCell: overlayPlaceholder,
      cell: (les) =>
        les.isPreview ? (
          <Badge variant="success" className="rounded px-2 font-medium">
            Preview
          </Badge>
        ) : (
          <span className="text-xs font-medium text-stone-400">Locked</span>
        ),
    },
    {
      key: "video",
      header: "Video",
      width: 160,
      minWidth: 120,
      headerClassName: "px-3 text-center",
      cellClassName: "px-3 py-3.5 text-center align-middle",
      overlayCell: overlayPlaceholder,
      cell: (les) =>
        les.videoStatus === "PROCESSING" ? (
          <Badge
            variant="warning"
            className="mx-auto flex w-max items-center justify-center gap-1.5 rounded px-2 font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            Processing video
          </Badge>
        ) : les.videoStatus === "READY" ? (
          <Badge variant="success" className="rounded px-2 font-medium">
            Ready
          </Badge>
        ) : les.videoStatus === "ERROR" ? (
          <Badge variant="danger" className="rounded px-2 font-medium">
            Error
          </Badge>
        ) : (
          <Badge variant="default" className="rounded px-2 font-medium">
            Unknown
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      width: 88,
      minWidth: 72,
      resizable: false,
      headerClassName: "px-3 text-center",
      cellClassName: "px-3 py-3.5 text-center align-middle",
      overlayCell: overlayPlaceholder,
      cell: (les) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-gray-100 focus:outline-none">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              disabled={les.videoStatus !== "READY"}
              onClick={() => handleOpenPreview(les)}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Eye className="h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {les.videoStatus === "ERROR" && (
              <>
                <DropdownMenuItem
                  onClick={() => requeueMutation.mutate(les.id)}
                  className="flex cursor-pointer items-center gap-2 text-sm text-amber-600 focus:text-amber-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reprocess video
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => handleOpenEdit(les)}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenSubtitle(les)}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Captions className="h-4 w-4" />
              {les.subtitleStorageKey ? "Replace subtitle" : "Add subtitle"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleOpenDelete(les)}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <AdminHeader title={sectionTitle} showSearch={false} />

      <div className="p-6 space-y-6">
        {/* Breadcrumbs */}
        <AdminBreadcrumb
          items={[
            { label: "Courses", href: "/admin/courses" },
            {
              label: courseTitle,
              href: courseId ? `/admin/courses/${courseId}/sections` : undefined,
            },
            { label: sectionTitle },
          ]}
        />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-850">{sectionTitle}</h2>
            <p className="text-sm text-stone-500 mt-1">
              Drag and drop to reorder lessons, then save to apply the new order
            </p>
          </div>
          <Button
            onClick={handleOpenAdd}
            leftIcon={<Plus className="h-4 w-4" />}
            className="md:w-auto w-full"
          >
            Add Lesson
          </Button>
        </div>


        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <AdminSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search lessons..."
          />
        </div>

        <ReorderDirtyBar
          visible={isOrderDirty}
          message="Lesson order will be updated for all students. Are you sure you want to save this change?"
          isSubmitting={reorderMutation.isPending}
          onSubmit={handleSubmitReorder}
          onDiscard={handleDiscardReorder}
        />

        {isSearching && orderedLessons.length > 1 && (
          <p className="text-xs text-stone-500">
            Searching — drag and drop is temporarily disabled. Clear the keyword to reorder.
          </p>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="border border-stone-200 bg-white rounded-xl divide-y divide-stone-100 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse p-4 flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-stone-200"></div>
                  <div className="space-y-2 flex-1 max-w-md">
                    <div className="h-4 bg-stone-200 rounded w-2/3"></div>
                    <div className="h-3 bg-stone-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-6 bg-stone-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && lessons.length === 0 && (
          <div className="text-center py-16 border border-dashed border-stone-300 rounded-xl bg-stone-50/50 max-w-xl mx-auto">
            <FolderClosed className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-4 text-lg font-bold text-stone-800">No lessons yet</h3>
            <p className="mt-2 text-sm text-stone-400 max-w-xs mx-auto">
              Upload the first lesson video so students can start learning.
            </p>
            <Button
              onClick={handleOpenAdd}
              leftIcon={<Plus className="h-4 w-4" />}
              className="mt-6 h-9 text-xs"
            >
              Add Lesson
            </Button>
          </div>
        )}

        {/* Lesson List Table */}
        {!isLoading && orderedLessons.length > 0 && (
          <AdminTable
            columns={columns}
            data={filteredLessons}
            getRowId={(les) => les.id}
            enableReorder
            enableColumnResize
            reorderDisabled={isSearching}
            onReorder={handleReorder}
            emptyMessage="No lessons match your search."
          />
        )}
      </div>

      {/* ======================================== */}
      {/* DIALOGS / MODALS                         */}
      {/* ======================================== */}

      {/* ADD LESSON MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-stone-200 bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-stone-850">Add new lesson</h3>
            <p className="text-xs text-stone-400 mt-1">Create a new video lesson and upload the required teaching files.</p>
            
            <form onSubmit={handleCreate} className="space-y-4 mt-4 max-h-[75vh] overflow-y-auto pr-1">
              <AdminInput
                label="Lesson title (minimum 10 characters)"
                placeholder="Enter lesson title..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                required
              />

              <Textarea
                label="Lesson description"
                placeholder="Brief description of the lesson content..."
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                rows={3}
              />

              {/* Video File */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600 select-none flex items-center gap-1.5">
                  <FileVideo className="h-4 w-4 text-stone-500" /> Lesson video file (.mp4, etc.)
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-500 border border-border bg-secondary rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-white hover:file:bg-stone-900 cursor-pointer"
                  required
                />
              </div>

              {/* Is Preview Checkbox */}
              <div className="flex items-center gap-2 pt-1.5 select-none">
                <input
                  id="isPreviewAdd"
                  type="checkbox"
                  checked={isPreviewInput}
                  onChange={(e) => setIsPreviewInput(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isPreviewAdd" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  Allow students to preview this lesson (Free Preview)
                </label>
              </div>

              {isCalculatingDuration && (
                <p className="text-xs text-amber-600 font-semibold animate-pulse">
                  Reading video duration...
                </p>
              )}

              {createMutation.isPending && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                    <span>
                      {uploadProgress < 100
                        ? "Uploading lesson to the system..."
                        : "Finishing..."}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="h-9 py-1 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || isCalculatingDuration}
                  className="h-9 py-1 px-3 text-xs"
                >
                  Upload lesson
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LESSON MODAL */}
      {isEditOpen && selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-stone-200 bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-stone-850">Edit lesson</h3>
            <p className="text-xs text-stone-400 mt-1">
              Update lesson details. You can replace the video (optional). Subtitles are managed separately.
            </p>

            <form onSubmit={handleUpdate} className="space-y-4 mt-4 max-h-[75vh] overflow-y-auto pr-1">
              <AdminInput
                label="Lesson title (minimum 10 characters)"
                placeholder="Enter lesson title..."
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                required
              />

              <Textarea
                label="Lesson description"
                placeholder="Brief description of the lesson content..."
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                rows={3}
              />

              <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600 select-none flex items-center gap-1.5">
                  <FileVideo className="h-4 w-4 text-stone-500" /> Replace video file (optional)
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-500 border border-border bg-secondary rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-white hover:file:bg-stone-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 select-none">
                <input
                  id="isPreviewEdit"
                  type="checkbox"
                  checked={isPreviewInput}
                  onChange={(e) => setIsPreviewInput(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isPreviewEdit" className="text-xs font-semibold text-stone-700 cursor-pointer">
                  Allow students to preview this lesson (Free Preview)
                </label>
              </div>

              {isCalculatingDuration && (
                <p className="text-xs text-amber-600 font-semibold animate-pulse">
                  Reading video duration...
                </p>
              )}

              {updateMutation.isPending && videoFile && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                    <span>
                      {uploadProgress < 100
                        ? "Uploading video to the system..."
                        : "Finishing..."}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="h-9 py-1 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={updateMutation.isPending || isCalculatingDuration}
                  className="h-9 py-1 px-3 text-xs"
                >
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTITLE MODAL */}
      {isSubtitleOpen && selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-stone-200 bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-stone-850">
              {selectedLesson.hasSubtitle ? "Replace subtitle" : "Add subtitle"}
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Lesson: <span className="font-medium text-stone-600">{selectedLesson.title}</span>
            </p>

            <form onSubmit={handleUploadSubtitle} className="space-y-4 mt-4">
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-600 select-none flex items-center gap-1.5">
                  <Captions className="h-4 w-4 text-stone-500" />
                  Subtitle file (.vtt, .srt)
                </label>
                <input
                  ref={subtitleInputRef}
                  type="file"
                  accept=".vtt,.srt,text/vtt,text/plain"
                  onChange={(e) => setSubtitleFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-500 border border-border bg-secondary rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-white hover:file:bg-stone-900 cursor-pointer"
                  required
                />
                {selectedLesson.hasSubtitle && !subtitleFile && (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    This lesson already has a subtitle — choose a new file to replace it.
                  </p>
                )}
                {subtitleFile && (
                  <p className="text-[11px] text-stone-500">
                    Selected: <span className="font-medium text-stone-700">{subtitleFile.name}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSubtitleOpen(false);
                    setSelectedLesson(null);
                    resetForm();
                  }}
                  className="h-9 py-1 px-3 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={subtitleMutation.isPending}
                  className="h-9 py-1 px-3 text-xs"
                >
                  {selectedLesson.hasSubtitle ? "Replace subtitle" : "Upload subtitle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <VideoPreviewModal
        lesson={previewLesson}
        onClose={() => setPreviewLesson(null)}
      />

      <ConfirmDeleteDialog
        open={isDeleteOpen && !!selectedLesson}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setSelectedLesson(null);
        }}
        title="Delete lesson?"
        description={
          <>
            {selectedLesson?.title} and its attached video will be permanently deleted. This action cannot
            be undone.
          </>
        }
        confirmLabel="Delete lesson"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
