import { api } from "@/services/api";
import type { PageResponse } from "@/types/api";
import type {
  QuizDetailResponseDto,
  QuizListParams,
  QuizResponseDto,
  TopicDetailResponseDto,
  TopicResponseDto,
} from "@/types/quiz";

export class QuizService {
  getTopics(params: QuizListParams = {}) {
    return api.get<PageResponse<TopicResponseDto>>("/api/v1/topics", {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getTopicById(topicId: string) {
    return api.get<TopicDetailResponseDto>(`/api/v1/topics/${topicId}`);
  }

  getQuizzes(params: QuizListParams = {}) {
    const { topicId, ...rest } = params;
    return api.get<PageResponse<QuizResponseDto>>("/api/v1/quizzes", {
      sort: "createdAt,DESC",
      topicId,
      ...rest,
    });
  }

  getQuizById(quizId: string) {
    return api.get<QuizDetailResponseDto>(`/api/v1/quizzes/${quizId}`);
  }
}

export const quizService = new QuizService();
