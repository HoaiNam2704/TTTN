import type { PageRequest } from "@/types/api";
import type {
  CreateQuestionRequestDto,
  CreateQuizOptionRequestDto,
  CreateQuizRequestDto,
  CreateTopicRequestDto,
  QuestionDetailResponseDto,
  QuestionResponseDto,
  QuizDetailResponseDto,
  QuizOptionResponseDto,
  QuizResponseDto,
  TopicDetailResponseDto,
  TopicResponseDto,
  UpdateQuestionRequestDto,
  UpdateQuizOptionRequestDto,
  UpdateQuizRequestDto,
  UpdateTopicRequestDto,
} from "@/types/quiz";

export type AdminTopicResponseDto = TopicResponseDto;
export type AdminTopicDetailResponseDto = TopicDetailResponseDto;
export type AdminQuizResponseDto = QuizResponseDto;
export type AdminQuizDetailResponseDto = QuizDetailResponseDto;
export type AdminQuestionResponseDto = QuestionResponseDto;
export type AdminQuestionDetailResponseDto = QuestionDetailResponseDto;
export type AdminQuizOptionResponseDto = QuizOptionResponseDto;

export type AdminTopicListParams = PageRequest & {
  search?: string;
};
export type AdminQuizListParams = PageRequest & {
  search?: string;
  topicId?: string;
  isPublished?: boolean;
};
export type AdminQuestionListParams = PageRequest & {
  quizId?: string;
};
export type AdminOptionListParams = PageRequest & {
  questionId?: string;
};

export type AdminCreateTopicRequestDto = CreateTopicRequestDto;
export type AdminUpdateTopicRequestDto = UpdateTopicRequestDto;
export type AdminCreateQuizRequestDto = CreateQuizRequestDto;
export type AdminUpdateQuizRequestDto = UpdateQuizRequestDto;
export type AdminCreateQuestionRequestDto = CreateQuestionRequestDto;
export type AdminUpdateQuestionRequestDto = UpdateQuestionRequestDto;
export type AdminCreateQuizOptionRequestDto = CreateQuizOptionRequestDto;
export type AdminUpdateQuizOptionRequestDto = UpdateQuizOptionRequestDto;
