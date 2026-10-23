import type {
  QuizAttemptDraft,
  QuizAttemptRecord,
  QuizHistoryRow,
} from "@/types/quiz";

const ATTEMPTS_KEY = "itis-quiz-attempts";

function getScopeKey() {
  if (typeof window === "undefined") {
    return "ssr";
  }
  return localStorage.getItem("userId") || "guest";
}

function getAttemptsKey() {
  return `${ATTEMPTS_KEY}:${getScopeKey()}`;
}

export function getQuizDraftKey(quizId: string) {
  return `${ATTEMPTS_KEY}:draft:${getScopeKey()}:${quizId}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadQuizDraft(quizId: string): QuizAttemptDraft | null {
  return readJson<QuizAttemptDraft | null>(getQuizDraftKey(quizId), null);
}

export function saveQuizDraft(draft: QuizAttemptDraft) {
  writeJson(getQuizDraftKey(draft.quizId), draft);
}

export function clearQuizDraft(quizId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getQuizDraftKey(quizId));
}

export function getQuizAttempts(): QuizAttemptRecord[] {
  const attempts = readJson<QuizAttemptRecord[]>(getAttemptsKey(), []);
  return attempts.sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function getQuizAttempt(attemptId: string): QuizAttemptRecord | null {
  return getQuizAttempts().find((attempt) => attempt.id === attemptId) ?? null;
}

export function getLatestQuizAttempt(quizId: string): QuizAttemptRecord | null {
  return (
    getQuizAttempts().find((attempt) => attempt.quizId === quizId) ?? null
  );
}

export function saveQuizAttempt(record: QuizAttemptRecord) {
  const attempts = getQuizAttempts();
  const nextAttempts = [record, ...attempts.filter((item) => item.id !== record.id)];
  writeJson(getAttemptsKey(), nextAttempts);
}

export function historyToRows(attempts: QuizAttemptRecord[]): QuizHistoryRow[] {
  return attempts.map((attempt) => ({
    id: attempt.id,
    quizId: attempt.quizId,
    topicId: attempt.topicId,
    topicName: attempt.topicName,
    quizTitle: attempt.quizTitle,
    scorePoints: attempt.scorePoints,
    totalPoints: attempt.totalPoints,
    scorePercent: attempt.scorePercent,
    correctCount: attempt.correctCount,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt,
    elapsedSeconds: attempt.elapsedSeconds,
    totalQuestions: attempt.totalQuestions,
  }));
}
