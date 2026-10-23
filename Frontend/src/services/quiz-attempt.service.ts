import { api } from "@/services/api";
import type { PageResponse } from "@/types/api";
import type {
  QuizAttemptDetailResponseDto,
  QuizAttemptHistoryResponseDto,
  QuizAttemptListParams,
  QuizAttemptSubmitRequestDto,
} from "@/types/quiz-attempt";

export class QuizAttemptService {
  submitAttempt(data: QuizAttemptSubmitRequestDto) {
    return api.post<QuizAttemptDetailResponseDto>("/api/v1/quiz-attempts", data);
  }

  getMyAttempts(params: QuizAttemptListParams = {}) {
    return api.get<PageResponse<QuizAttemptHistoryResponseDto>>("/api/v1/quiz-attempts", {
      sort: "submittedAt,DESC",
      ...params,
    });
  }

  getAttemptById(attemptId: string) {
    return api.get<QuizAttemptDetailResponseDto>(`/api/v1/quiz-attempts/${attemptId}`);
  }

  getLatestAttemptByQuizId(quizId: string) {
    return api.get<QuizAttemptDetailResponseDto>("/api/v1/quiz-attempts/latest", { quizId });
  }
}

export const quizAttemptService = new QuizAttemptService();
