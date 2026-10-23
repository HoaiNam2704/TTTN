import type { PageRequest, PageResponse } from "@/types/api";
import type { QuestionDetailResponseDto } from "@/types/quiz";

export interface QuizAttemptSubmitRequestDto {
  quizId: string;
  startedAt: string;
  answersByQuestionId: Record<string, string | null>;
}

export interface QuizAttemptHistoryResponseDto {
  id: string;
  quizId: string;
  topicId: string;
  topicName: string;
  quizTitle: string;
  quizDescription?: string | null;
  duration?: number | null;
  passingScore?: number | null;
  startedAt: string;
  submittedAt: string;
  elapsedSeconds: number;
  totalQuestions: number;
  totalPoints: number;
  correctCount: number;
  incorrectCount: number;
  scorePoints: number;
  scorePercent: number;
  passed: boolean;
}

export interface QuizAttemptDetailResponseDto extends QuizAttemptHistoryResponseDto {
  answersByQuestionId: Record<string, string | null>;
  questions: QuestionDetailResponseDto[];
}

export interface QuizAttemptListParams extends PageRequest {}

export type QuizAttemptPageResponseDto = PageResponse<QuizAttemptHistoryResponseDto>;
