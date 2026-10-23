"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/services/api";
import {
  courseReviewsQueryKey,
  reviewService,
} from "@/services/review.service";
import {
  computeReviewSummary,
  getReviewDisplayName,
  type ReviewResponseDto,
} from "@/types/review";

interface CourseReviewsProps {
  courseId: string;
  isEnrolled: boolean;
}

function StarRating({
  value,
  onChange,
  size = "md",
  readOnly = false,
  hoverPreview = false,
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg" | "xl";
  readOnly?: boolean;
  hoverPreview?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass =
    size === "sm"
      ? "h-3.5 w-3.5"
      : size === "lg"
        ? "h-7 w-7"
        : size === "xl"
          ? "h-8 w-8"
          : "h-5 w-5";

  const displayValue = hoverPreview && hovered > 0 ? hovered : value;

  return (
    <div
      className="flex items-center gap-0.5"
      role={readOnly ? "img" : "radiogroup"}
      aria-label="Star rating"
      onMouseLeave={() => hoverPreview && setHovered(0)}
    >
      {Array.from({ length: 5 }).map((_, idx) => {
        const star = idx + 1;
        const filled = star <= displayValue;
        if (readOnly) {
          return (
            <Star
              key={star}
              className={cn(sizeClass, filled ? "fill-amber-400 text-amber-400" : "text-stone-300")}
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => hoverPreview && setHovered(star)}
            className={cn(
              "rounded p-0.5 transition-all duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              filled && "drop-shadow-[0_0_3px_rgba(245,158,11,0.4)]"
            )}
            aria-label={`${star} stars`}
            aria-pressed={star <= value}
          >
            <Star
              className={cn(
                sizeClass,
                "transition-colors duration-150",
                filled ? "fill-amber-400 text-amber-400" : "text-stone-300 hover:text-amber-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function formatReviewDate(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ReviewForm({
  initialRating = 0,
  initialComment = "",
  submitLabel,
  isPending,
  onSubmit,
  onCancel,
}: {
  initialRating?: number;
  initialComment?: string;
  submitLabel: string;
  isPending: boolean;
  onSubmit: (data: { rating: number; comment?: string }) => void;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }
    onSubmit({
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-stone-700">Your rating</p>
        <div className="flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} size="xl" hoverPreview />
          {rating > 0 && (
            <span className="text-sm font-medium text-amber-600">
              {rating}/5
            </span>
          )}
        </div>
      </div>
      <Textarea
        label="Comment (optional)"
        placeholder="Share your learning experience…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={5000}
      />
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-9 border-stone-300 bg-white text-xs hover:bg-stone-50">
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isPending} className="h-9 text-xs">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function CourseReviews({ courseId, isEnrolled }: CourseReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: courseReviewsQueryKey(courseId),
    queryFn: () =>
      reviewService.getReviews({
        courseId,
        page: 0,
        size: 50,
        sort: "createdAt,DESC",
      }),
    enabled: !!courseId,
  });

  const reviews = data?.content ?? [];
  const summary = useMemo(
    () => computeReviewSummary(reviews, data?.totalElements),
    [reviews, data?.totalElements]
  );

  const myReview = useMemo(() => {
    if (!user?.userId) return null;
    return reviews.find((r) => r.userId === user.userId) ?? null;
  }, [reviews, user?.userId]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: courseReviewsQueryKey(courseId) });
  };

  const createMutation = useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) =>
      reviewService.createReview({
        courseId,
        rating: payload.rating,
        comment: payload.comment,
      }),
    onSuccess: () => {
      addToast({ type: "success", message: "Your review has been submitted." });
      setShowCreateForm(false);
      invalidate();
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "Could not submit review.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) =>
      reviewService.updateReview(myReview!.id, {
        rating: payload.rating,
        comment: payload.comment,
      }),
    onSuccess: () => {
      addToast({ type: "success", message: "Review updated." });
      setIsEditing(false);
      invalidate();
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "Could not update review.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => reviewService.deleteReview(myReview!.id),
    onSuccess: () => {
      addToast({ type: "success", message: "Review deleted." });
      setIsDeleteOpen(false);
      setIsEditing(false);
      invalidate();
    },
    onError: (err) => {
      addToast({
        type: "error",
        message: (err as ApiError)?.message || "Could not delete review.",
      });
    },
  });

  const otherReviews = myReview
    ? reviews.filter((r) => r.id !== myReview.id)
    : reviews;

  return (
    <section className="space-y-4">
      {isLoading && (
        <div className="animate-pulse space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm" role="status" aria-label="Loading reviews">
          <div className="h-24 rounded-xl bg-stone-100" />
          <div className="h-16 rounded-xl bg-stone-100" />
          <div className="h-16 rounded-xl bg-stone-100" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 shadow-sm">
          <p className="text-sm text-red-500">Could not load reviews. Please try again later.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Card 1: Rating summary + Histogram */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-stone-900">Student reviews</h2>
            <div className="flex flex-col items-stretch gap-8 md:flex-row">
              {/* Big rating number */}
              <div className="flex shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted px-6 py-5 text-center md:min-w-[160px]">
                <span
                  className="font-extrabold leading-none text-stone-900"
                  style={{ fontSize: "42px" }}
                >
                  {summary.count > 0 ? summary.average.toFixed(1) : "0.0"}
                </span>
                <div className="my-2.5">
                  <StarRating
                    value={summary.count > 0 ? Math.round(summary.average) : 0}
                    readOnly
                    size="md"
                  />
                </div>
                <span className="text-sm font-medium text-stone-500">
                  {summary.count > 0
                    ? `${summary.count.toLocaleString("en-US")} ${summary.count === 1 ? "review" : "reviews"}`
                    : "No reviews yet"}
                </span>
              </div>

              {/* Histogram bars */}
              <div className="flex flex-1 flex-col justify-center gap-2.5">
                {([5, 4, 3, 2, 1] as const).map((stars) => {
                  const pct = summary.count > 0 ? summary.breakdown[stars] : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="w-12 text-right text-sm font-semibold text-stone-600">
                        {stars} {stars === 1 ? "star" : "stars"}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-medium text-stone-500">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Write / edit own review */}
          {isAuthenticated && isEnrolled && (
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-stone-800">Your review</h3>
              {!myReview && !showCreateForm && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(true)}
                  className="h-9 text-xs"
                >
                  Write a review
                </Button>
              )}

              {!myReview && showCreateForm && (
                <ReviewForm
                  submitLabel="Submit review"
                  isPending={createMutation.isPending}
                  onSubmit={(payload) => createMutation.mutate(payload)}
                  onCancel={() => setShowCreateForm(false)}
                />
              )}

              {myReview && !isEditing && (
                <div className="rounded-xl border border-primary/15 bg-[#fff8f8] p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">
                        Your review
                      </p>
                      <div className="mt-1">
                        <StarRating value={myReview.rating ?? 0} readOnly size="sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="rounded-md p-1.5 text-stone-500 hover:bg-white hover:text-stone-800"
                        aria-label="Edit review"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeleteOpen(true)}
                        className="rounded-md p-1.5 text-stone-500 hover:bg-white hover:text-red-600"
                        aria-label="Delete review"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {myReview.comment && (
                    <p className="text-[13px] leading-relaxed text-stone-600">{myReview.comment}</p>
                  )}
                </div>
              )}

              {myReview && isEditing && (
                <ReviewForm
                  initialRating={myReview.rating ?? 0}
                  initialComment={myReview.comment ?? ""}
                  submitLabel="Save changes"
                  isPending={updateMutation.isPending}
                  onSubmit={(payload) => updateMutation.mutate(payload)}
                  onCancel={() => setIsEditing(false)}
                />
              )}
            </div>
          )}

          {isAuthenticated && !isEnrolled && (
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-stone-500">
                You need to enroll in the course to write a review.
              </p>
            </div>
          )}

          {/* Card 3: Reviews list */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">

            {otherReviews.length === 0 && !myReview && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                  <Star className="h-7 w-7 text-amber-400" />
                </div>
                <p className="text-sm font-medium text-stone-600">
                  No reviews yet
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Be the first to share your learning experience.
                </p>
              </div>
            )}

            {otherReviews.length === 0 && myReview && (
              <p className="py-2 text-sm text-stone-400">
                No other reviews yet.
              </p>
            )}

            <div className="space-y-0 divide-y divide-stone-100">
              {otherReviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          </div>
        </>
      )}

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete review?"
        description="Your review will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete review"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </section>
  );
}

function ReviewItem({ review }: { review: ReviewResponseDto }) {
  const name = getReviewDisplayName(review);
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-muted-foreground">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-stone-800">{name}</h4>
              <div className="mt-0.5 flex items-center gap-2">
                <StarRating value={review.rating ?? 0} readOnly size="sm" />
                <span className="text-xs text-stone-400">{formatReviewDate(review.createdAt)}</span>
              </div>
            </div>
          </div>
          {review.comment && (
            <p className="mt-2 text-[13px] leading-relaxed text-stone-600">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Compact rating badge for hero — shares the same react-query cache. */
export function CourseRatingBadge({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: courseReviewsQueryKey(courseId),
    queryFn: () =>
      reviewService.getReviews({
        courseId,
        page: 0,
        size: 50,
        sort: "createdAt,DESC",
      }),
    enabled: !!courseId,
  });

  const summary = useMemo(
    () => computeReviewSummary(data?.content ?? [], data?.totalElements),
    [data]
  );

  if (isLoading) {
    return <span className="text-xs text-stone-500">Loading reviews…</span>;
  }

  if (summary.count === 0) {
    return <span className="text-xs text-stone-400">No reviews yet</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base font-bold text-amber-500">{summary.average.toFixed(1)}</span>
      <div className="flex items-center text-amber-500">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Star
            key={idx}
            className={cn(
              "h-4 w-4 fill-current",
              idx < Math.round(summary.average) ? "text-amber-500" : "text-stone-300"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-stone-400">({summary.count} {summary.count === 1 ? "review" : "reviews"})</span>
    </div>
  );
}
