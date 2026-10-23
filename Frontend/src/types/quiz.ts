import type { PageRequest, PageResponse } from "@/types/api";

export interface TopicResponseDto {
  id: string;
  name: string;
  description?: string | null;
  quizCount?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TopicDetailResponseDto extends TopicResponseDto {
  quizzes: QuizResponseDto[];
}

export interface QuizResponseDto {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  passingScore?: number | null;
  isPublished: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface QuizDetailResponseDto extends QuizResponseDto {
  questions: QuestionDetailResponseDto[];
}

export interface QuestionResponseDto {
  id: string;
  quizId: string;
  content: string;
  explanation?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface QuestionDetailResponseDto extends QuestionResponseDto {
  options: QuizOptionResponseDto[];
}

export interface QuizOptionResponseDto {
  id: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface QuizListParams extends PageRequest {
  topicId?: string;
}

export interface QuizAttemptDraft {
  quizId: string;
  startedAt: string;
  answersByQuestionId: Record<string, string | null>;
}

export interface QuizAttemptQuestionSnapshot {
  id: string;
  quizId: string;
  content: string;
  explanation?: string | null;
  options: QuizOptionResponseDto[];
}

export interface QuizAttemptRecord {
  id: string;
  userId: string;
  quizId: string;
  topicId: string;
  topicName: string;
  quizTitle: string;
  quizDescription?: string | null;
  duration: number | null;
  passingScore: number | null;
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
  answersByQuestionId: Record<string, string | null>;
  questions: QuizAttemptQuestionSnapshot[];
}

export interface QuizSummaryCardData {
  id: string;
  title: string;
  description?: string | null;
  quizCount: number;
}

export interface QuizHistoryRow {
  id: string;
  quizId: string;
  topicId: string;
  topicName: string;
  quizTitle: string;
  scorePoints: number;
  totalPoints: number;
  scorePercent: number;
  correctCount: number;
  passed: boolean;
  submittedAt: string;
  elapsedSeconds: number;
  totalQuestions: number;
}

export interface QuizHistoryStore {
  attempts: QuizAttemptRecord[];
}

export type QuizPageResponseDto<T> = PageResponse<T>;

export interface CreateTopicRequestDto {
  name: string;
  description?: string | null;
}

export interface UpdateTopicRequestDto {
  name?: string;
  description?: string | null;
}

export interface CreateQuizRequestDto {
  topicId: string;
  title: string;
  description?: string | null;
  duration: number;
  isPublished?: boolean | null;
}

export interface UpdateQuizRequestDto {
  topicId?: string | null;
  title?: string;
  description?: string | null;
  duration?: number;
  isPublished?: boolean | null;
}

export interface CreateQuestionRequestDto {
  quizId: string;
  content: string;
  explanation?: string | null;
}

export interface UpdateQuestionRequestDto {
  quizId?: string | null;
  content?: string;
  explanation?: string | null;
}

export interface CreateQuizOptionRequestDto {
  questionId: string;
  content: string;
  isCorrect: boolean;
}

export interface UpdateQuizOptionRequestDto {
  questionId?: string | null;
  content?: string;
  isCorrect?: boolean | null;
}
