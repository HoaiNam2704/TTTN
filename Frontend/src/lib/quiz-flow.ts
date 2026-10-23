import type {
  QuizAttemptQuestionSnapshot,
  QuizDetailResponseDto,
  QuizOptionResponseDto,
  QuestionDetailResponseDto,
} from "@/types/quiz";
import {
  QUIZ_MAX_SCORE,
  QUIZ_PASS_PERCENT,
  calcQuizScorePercent,
  isQuizPassed,
} from "@/lib/quiz-scoring";

export function formatQuizMinutes(minutes?: number | null) {
  if (minutes === null || minutes === undefined) {
    return "Not set";
  }
  return `${minutes} min`;
}

export function formatQuizCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatQuizDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatQuizDateOnly(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
  }).format(new Date(value));
}

export function formatQuizElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")} min ${String(remainingSeconds).padStart(2, "0")} sec`;
}

export function getQuestionCount(quiz?: Pick<QuizDetailResponseDto, "questions"> | null) {
  return quiz?.questions?.length ?? 0;
}

export function getCorrectOption(options: QuizOptionResponseDto[]) {
  return options.find((option) => option.isCorrect) ?? null;
}

export function buildQuestionSnapshots(
  questions: QuestionDetailResponseDto[]
): QuizAttemptQuestionSnapshot[] {
  return questions.map((question) => ({
    id: question.id,
    quizId: question.quizId,
    content: question.content,
    explanation: question.explanation,
    options: question.options,
  }));
}

export function gradeQuizAttempt(
  quiz: QuizDetailResponseDto,
  answersByQuestionId: Record<string, string | null>
) {
  const questions = quiz.questions;
  let correctCount = 0;
  let incorrectCount = 0;

  for (const question of questions) {
    const selectedOptionId = answersByQuestionId[question.id] ?? null;
    const correctOption = getCorrectOption(question.options);
    const isCorrect = !!correctOption && selectedOptionId === correctOption.id;

    if (isCorrect) {
      correctCount += 1;
    } else {
      incorrectCount += 1;
    }
  }

  const totalQuestions = questions.length;
  const scorePercent = calcQuizScorePercent(correctCount, totalQuestions);
  const passed = isQuizPassed(scorePercent);

  return {
    totalQuestions,
    totalPoints: QUIZ_MAX_SCORE,
    scorePoints: scorePercent,
    correctCount,
    incorrectCount,
    scorePercent,
    passed,
    passingScore: QUIZ_PASS_PERCENT,
  };
}
