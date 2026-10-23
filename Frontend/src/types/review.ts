import type { PageRequest } from "@/types/api";

export interface ReviewResponseDto {
  id: string;
  courseId: string;
  userId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  rating?: number | null;
  comment?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReviewRequestDto {
  courseId: string;
  rating?: number;
  comment?: string;
}

export interface UpdateReviewRequestDto {
  rating?: number;
  comment?: string;
}

export interface ReviewListParams extends PageRequest {
  courseId?: string;
  rating?: number;
  fromDate?: string;
  toDate?: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  /** Percent of reviews per star 1..5 */
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function getReviewDisplayName(review: ReviewResponseDto): string {
  const full = [review.firstName, review.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (review.username) return review.username;
  return "Student";
}

export function computeReviewSummary(reviews: ReviewResponseDto[], totalCount?: number): ReviewSummary {
  const rated = reviews.filter((r) => typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5);
  const count = totalCount ?? rated.length;
  const sum = rated.reduce((acc, r) => acc + (r.rating ?? 0), 0);
  const average = rated.length > 0 ? sum / rated.length : 0;

  const tallies: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rated) {
    const star = Math.round(r.rating!) as 1 | 2 | 3 | 4 | 5;
    if (star >= 1 && star <= 5) tallies[star] += 1;
  }

  const denom = rated.length || 1;
  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: Math.round((tallies[1] / denom) * 100),
    2: Math.round((tallies[2] / denom) * 100),
    3: Math.round((tallies[3] / denom) * 100),
    4: Math.round((tallies[4] / denom) * 100),
    5: Math.round((tallies[5] / denom) * 100),
  };

  return { average, count, breakdown };
}
