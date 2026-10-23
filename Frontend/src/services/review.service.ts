import { api } from "@/services/api";
import type { PageResponse } from "@/types/api";
import type {
  CreateReviewRequestDto,
  ReviewListParams,
  ReviewResponseDto,
  UpdateReviewRequestDto,
} from "@/types/review";

export class ReviewService {
  getReviews(params: ReviewListParams = {}) {
    return api.get<PageResponse<ReviewResponseDto>>("/api/v1/reviews", {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getReviewById(reviewId: string) {
    return api.get<ReviewResponseDto>(`/api/v1/reviews/${reviewId}`);
  }

  createReview(data: CreateReviewRequestDto) {
    return api.post<ReviewResponseDto>("/api/v1/reviews", data);
  }

  updateReview(reviewId: string, data: UpdateReviewRequestDto) {
    return api.patch<ReviewResponseDto>(`/api/v1/reviews/${reviewId}`, data);
  }

  deleteReview(reviewId: string) {
    return api.delete<void>(`/api/v1/reviews/${reviewId}`);
  }
}

export const reviewService = new ReviewService();

export function courseReviewsQueryKey(courseId: string) {
  return ["course-reviews", courseId] as const;
}
