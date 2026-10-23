import { api } from "@/services/api";
import type { PageResponse } from "@/types/api";
import type {
  AdminCreateQuestionRequestDto,
  AdminCreateQuizOptionRequestDto,
  AdminCreateQuizRequestDto,
  AdminCreateTopicRequestDto,
  AdminQuestionDetailResponseDto,
  AdminQuestionListParams,
  AdminQuestionResponseDto,
  AdminQuizDetailResponseDto,
  AdminQuizListParams,
  AdminQuizOptionResponseDto,
  AdminQuizResponseDto,
  AdminTopicListParams,
  AdminTopicResponseDto,
  AdminUpdateQuestionRequestDto,
  AdminUpdateQuizOptionRequestDto,
  AdminUpdateQuizRequestDto,
  AdminUpdateTopicRequestDto,
  AdminOptionListParams,
} from "@/types/quiz-admin";

export class QuizAdminService {
  getTopics(params: AdminTopicListParams = {}) {
    return api.get<PageResponse<AdminTopicResponseDto>>("/api/v1/topics", {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getTopicById(topicId: string) {
    return api.get<AdminTopicResponseDto>(`/api/v1/topics/${topicId}`);
  }

  createTopic(data: AdminCreateTopicRequestDto) {
    return api.post<AdminTopicResponseDto>("/api/v1/admin/topics", data);
  }

  updateTopic(topicId: string, data: AdminUpdateTopicRequestDto) {
    return api.patch<AdminTopicResponseDto>(`/api/v1/admin/topics/${topicId}`, data);
  }

  deleteTopic(topicId: string) {
    return api.delete<void>(`/api/v1/admin/topics/${topicId}`);
  }

  getQuizzes(params: AdminQuizListParams = {}) {
    return api.get<PageResponse<AdminQuizResponseDto>>("/api/v1/quizzes", {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getQuizById(quizId: string) {
    return api.get<AdminQuizDetailResponseDto>(`/api/v1/quizzes/${quizId}`);
  }

  createQuiz(data: AdminCreateQuizRequestDto) {
    return api.post<AdminQuizResponseDto>("/api/v1/admin/quizzes", data);
  }

  updateQuiz(quizId: string, data: AdminUpdateQuizRequestDto) {
    return api.patch<AdminQuizResponseDto>(`/api/v1/admin/quizzes/${quizId}`, data);
  }

  publishQuiz(quizId: string) {
    return api.patch<AdminQuizResponseDto>(`/api/v1/admin/quizzes/${quizId}/publish`, {});
  }

  unpublishQuiz(quizId: string) {
    return api.patch<AdminQuizResponseDto>(`/api/v1/admin/quizzes/${quizId}/unpublish`, {});
  }

  deleteQuiz(quizId: string) {
    return api.delete<void>(`/api/v1/admin/quizzes/${quizId}`);
  }

  getQuestions(params: AdminQuestionListParams = {}) {
    return api.get<PageResponse<AdminQuestionResponseDto>>("/api/v1/admin/questions", {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getQuestionById(questionId: string) {
    return api.get<AdminQuestionDetailResponseDto>(`/api/v1/admin/questions/${questionId}`);
  }

  createQuestion(data: AdminCreateQuestionRequestDto) {
    return api.post<AdminQuestionDetailResponseDto>("/api/v1/admin/questions", data);
  }

  updateQuestion(questionId: string, data: AdminUpdateQuestionRequestDto) {
    return api.patch<AdminQuestionDetailResponseDto>(`/api/v1/admin/questions/${questionId}`, data);
  }

  deleteQuestion(questionId: string) {
    return api.delete<void>(`/api/v1/admin/questions/${questionId}`);
  }

  getOptions(params: AdminOptionListParams = {}) {
    return api.get<PageResponse<AdminQuizOptionResponseDto>>("/api/v1/admin/options", {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getOptionById(optionId: string) {
    return api.get<AdminQuizOptionResponseDto>(`/api/v1/admin/options/${optionId}`);
  }

  createOption(data: AdminCreateQuizOptionRequestDto) {
    return api.post<AdminQuizOptionResponseDto>("/api/v1/admin/options", data);
  }

  updateOption(optionId: string, data: AdminUpdateQuizOptionRequestDto) {
    return api.patch<AdminQuizOptionResponseDto>(`/api/v1/admin/options/${optionId}`, data);
  }

  deleteOption(optionId: string) {
    return api.delete<void>(`/api/v1/admin/options/${optionId}`);
  }
}

export const quizAdminService = new QuizAdminService();
