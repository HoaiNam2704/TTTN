"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  BookOpen,
  Menu,
  Send,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { quizService } from "@/services/quiz.service";
import { quizAttemptService } from "@/services/quiz-attempt.service";
import {
  buildQuestionSnapshots,
  formatQuizCountdown,
  formatQuizMinutes,
  gradeQuizAttempt,
} from "@/lib/quiz-flow";
import {
  QUIZ_MAX_SCORE,
  QUIZ_PASS_PERCENT,
  calcQuizScorePercent,
  isQuizPassed,
} from "@/lib/quiz-scoring";
import {
  clearQuizDraft,
  loadQuizDraft,
  saveQuizAttempt,
  saveQuizDraft,
} from "@/lib/quiz-storage";
import { cn } from "@/lib/utils";
import type { QuizAttemptRecord } from "@/types/quiz";

function createInitialAnswers(questionIds: string[]) {
  return Object.fromEntries(questionIds.map((id) => [id, null])) as Record<
    string,
    string | null
  >;
}

function SubmitConfirmModal({
  open,
  answeredCount,
  unansweredCount,
  onClose,
  onConfirm,
}: {
  open: boolean;
  answeredCount: number;
  unansweredCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-md border-border bg-white" padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase font-medium text-muted-foreground">
              Confirm submission
            </p>
            <h3 className="mt-2 text-xl font-bold text-foreground">
              Are you sure you want to submit?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Answered</span>
            <strong className="text-foreground">{answeredCount}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Unanswered</span>
            <strong className="text-foreground">{unansweredCount}</strong>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Confirm submit
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function QuizAttemptPage() {
  const params = useParams<{ topicId: string; quizId: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { topicId, quizId } = params;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<
    Record<string, string | null>
  >({});
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const {
    data: quiz,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["quiz-attempt", quizId],
    queryFn: () => quizService.getQuizById(quizId),
    enabled: !!quizId && isAuthenticated,
  });

  const questionIds = useMemo(
    () => quiz?.questions.map((question) => question.id) ?? [],
    [quiz]
  );

  const answeredCount = useMemo(
    () =>
      Object.values(answersByQuestionId).filter((value) => value !== null).length,
    [answersByQuestionId]
  );

  const unansweredCount = Math.max(questionIds.length - answeredCount, 0);
  const currentQuestion = quiz?.questions[activeQuestionIndex] ?? null;
  const durationSeconds = (quiz?.duration ?? 0) * 60;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!quiz) return;

    const draft = loadQuizDraft(quiz.id);
    const initialAnswers = createInitialAnswers(quiz.questions.map((q) => q.id));

    if (draft?.quizId === quiz.id) {
      setAnswersByQuestionId({ ...initialAnswers, ...draft.answersByQuestionId });
      setStartedAt(draft.startedAt);
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(draft.startedAt).getTime()) / 1000
      );
      setRemainingSeconds(Math.max(durationSeconds - elapsedSeconds, 0));
    } else {
      const started = new Date().toISOString();
      setAnswersByQuestionId(initialAnswers);
      setStartedAt(started);
      setRemainingSeconds(durationSeconds);
      saveQuizDraft({
        quizId: quiz.id,
        startedAt: started,
        answersByQuestionId: initialAnswers,
      });
    }

    setActiveQuestionIndex(0);
    setHasSubmitted(false);
    setShowSubmitConfirm(false);
  }, [quiz, durationSeconds]);

  useEffect(() => {
    if (!quiz || !startedAt || hasSubmitted) return;

    const interval = window.setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 1000
      );
      const nextRemaining = Math.max(durationSeconds - elapsedSeconds, 0);
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [quiz, startedAt, durationSeconds, hasSubmitted]);

  useEffect(() => {
    if (!quiz || hasSubmitted) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [quiz, hasSubmitted]);

  useEffect(() => {
    if (!quiz || !startedAt || hasSubmitted) return;
    saveQuizDraft({
      quizId: quiz.id,
      startedAt,
      answersByQuestionId,
    });
  }, [quiz, startedAt, answersByQuestionId, hasSubmitted]);

  useEffect(() => {
    if (!quiz || !startedAt || !remainingSeconds || hasSubmitted) return;
    if (remainingSeconds > 0) return;
    void submitAttempt(true);
  }, [quiz, startedAt, remainingSeconds, hasSubmitted]);

  function updateAnswer(questionId: string, optionId: string) {
    if (hasSubmitted) return;
    setAnswersByQuestionId((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  }

  function goToQuestion(index: number) {
    setActiveQuestionIndex(index);
    setSidebarOpen(false);
  }

  function openSubmitConfirm() {
    setShowSubmitConfirm(true);
  }

  async function submitAttempt(autoSubmit = false) {
    if (!quiz || !startedAt || hasSubmitted) return;

    try {
      const attempt = await quizAttemptService.submitAttempt({
        quizId: quiz.id,
        startedAt,
        answersByQuestionId,
      });

      const scorePercent = calcQuizScorePercent(
        attempt.correctCount,
        attempt.totalQuestions
      );

      saveQuizAttempt({
        id: attempt.id,
        userId: user?.userId || "guest",
        quizId: attempt.quizId,
        topicId: attempt.topicId,
        topicName: attempt.topicName,
        quizTitle: attempt.quizTitle,
        quizDescription: attempt.quizDescription ?? null,
        duration: attempt.duration ?? null,
        passingScore: QUIZ_PASS_PERCENT,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        elapsedSeconds: attempt.elapsedSeconds,
        totalQuestions: attempt.totalQuestions,
        totalPoints: QUIZ_MAX_SCORE,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        scorePoints: scorePercent,
        scorePercent,
        passed: isQuizPassed(scorePercent),
        answersByQuestionId: attempt.answersByQuestionId,
        questions: attempt.questions,
      });
      clearQuizDraft(quiz.id);
      setHasSubmitted(true);
      setShowSubmitConfirm(false);

      router.replace(ROUTES.QUIZ_RESULT(topicId, quiz.id, attempt.id));
      return;
    } catch {
      const result = gradeQuizAttempt(quiz, answersByQuestionId);
      const submittedAt = new Date().toISOString();
      const elapsedSeconds = Math.max(
        Math.floor(
          (new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000
        ),
        0
      );
      const attempt: QuizAttemptRecord = {
        id: crypto.randomUUID(),
        userId: user?.userId || "guest",
        quizId: quiz.id,
        topicId: quiz.topicId,
        topicName: quiz.topicName,
        quizTitle: quiz.title,
        quizDescription: quiz.description,
        duration: quiz.duration ?? null,
        passingScore: QUIZ_PASS_PERCENT,
        startedAt,
        submittedAt,
        elapsedSeconds,
        totalQuestions: result.totalQuestions,
        totalPoints: result.totalPoints,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        scorePoints: result.scorePoints,
        scorePercent: result.scorePercent,
        passed: result.passed,
        answersByQuestionId,
        questions: buildQuestionSnapshots(quiz.questions),
      };

      saveQuizAttempt(attempt);
      clearQuizDraft(quiz.id);
      setHasSubmitted(true);
      setShowSubmitConfirm(false);

      router.replace(ROUTES.QUIZ_RESULT(topicId, quiz.id, attempt.id));
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (isError || !quiz) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md border-border bg-white text-center" padding="lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-foreground">
            Could not load quiz
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "An error occurred while loading the quiz."}
          </p>
          <Link
            href={ROUTES.QUIZ_DETAIL(topicId, quizId)}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Back to quiz details
          </Link>
        </Card>
      </div>
    );
  }

  if (!quiz.isPublished) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md border-border bg-white text-center" padding="lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-foreground">
            Quiz not published
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This quiz is not yet open for users to take.
          </p>
          <Link
            href={ROUTES.QUIZ_DETAIL(topicId, quizId)}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Back to quiz details
          </Link>
        </Card>
      </div>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md border-border bg-white text-center" padding="lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-foreground">
            Quiz has no questions
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add questions and answers in the backend before allowing users to take this quiz.
          </p>
          <Link
            href={ROUTES.QUIZ_DETAIL(topicId, quizId)}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Back to quiz details
          </Link>
        </Card>
      </div>
    );
  }

  const activeRemainingSeconds = remainingSeconds ?? durationSeconds;
  const activeQuestionStatus = answersByQuestionId[currentQuestion?.id ?? ""] ? "Answer selected" : "Unanswered";

  return (
    <div className="flex h-screen bg-muted overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[84vw] max-w-sm shadow-2xl">
            <QuestionSidebar
              quizTitle={quiz.title}
              currentIndex={activeQuestionIndex}
              questions={quiz.questions}
              answersByQuestionId={answersByQuestionId}
              onSelect={goToQuestion}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <aside className="hidden w-[320px] shrink-0 lg:flex">
        <QuestionSidebar
          quizTitle={quiz.title}
          currentIndex={activeQuestionIndex}
          questions={quiz.questions}
          answersByQuestionId={answersByQuestionId}
          onSelect={goToQuestion}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-border bg-white/90 px-4 py-3.5 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Open question list"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <Link
              href={ROUTES.QUIZ_DETAIL(topicId, quiz.id)}
              className="text-xs font-semibold uppercase font-medium text-muted-foreground"
            >
              Practice / {quiz.topicName}
            </Link>
            <h1 className="truncate text-base font-bold text-foreground sm:text-lg">
              {quiz.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold text-foreground">
            <Clock3 className="h-4 w-4 text-primary" />
            <span>{formatQuizCountdown(activeRemainingSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={openSubmitConfirm}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Send className="mr-2 h-4 w-4" />
            Submit
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="default">
                Question {activeQuestionIndex + 1}
              </Badge>
              <Badge variant={activeQuestionStatus === "Answer selected" ? "success" : "warning"}>
                {activeQuestionStatus}
              </Badge>
              <Badge variant="info">
                {answeredCount}/{quiz.questions.length} answered
              </Badge>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
              <div className="space-y-5">
                <Card className="border-border bg-white" padding="lg">
                  <div>
                    <p className="text-xs font-semibold uppercase font-medium text-muted-foreground">
                      Quiz attempt
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-foreground">
                      Question {activeQuestionIndex + 1} / {quiz.questions.length}
                    </h2>
                  </div>

                  {currentQuestion && (
                    <>
                      <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
                        <p className="text-lg font-semibold leading-8 text-foreground">
                          {currentQuestion.content}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {currentQuestion.options.length} {currentQuestion.options.length === 1 ? "option" : "options"}
                        </p>
                      </div>

                      <div className="mt-5 space-y-3">
                        {currentQuestion.options.map((option) => {
                          const selected =
                            answersByQuestionId[currentQuestion.id] === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                updateAnswer(currentQuestion.id, option.id)
                              }
                              className={cn(
                                "flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition",
                                selected
                                  ? "border-primary bg-accent shadow-sm"
                                  : "border-border bg-white hover:border-primary/30 hover:bg-muted"
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-white text-muted-foreground"
                                )}
                              >
                                {String.fromCharCode(65 + currentQuestion.options.indexOf(option))}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium leading-6 text-foreground">
                                  {option.content}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </Card>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveQuestionIndex((current) => Math.max(current - 1, 0))
                    }
                    disabled={activeQuestionIndex === 0}
                    className={cn(
                      "inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                      activeQuestionIndex === 0
                        ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                        : "border-border bg-white text-foreground hover:bg-muted"
                    )}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveQuestionIndex((current) =>
                          Math.min(current + 1, quiz.questions.length - 1)
                        )
                      }
                      disabled={activeQuestionIndex === quiz.questions.length - 1}
                      className={cn(
                        "inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                        activeQuestionIndex === quiz.questions.length - 1
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                          : "border-border bg-white text-foreground hover:bg-muted"
                      )}
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={openSubmitConfirm}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </button>
                  </div>
                </div>

                <Card className="border-border bg-white lg:hidden" padding="md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {answeredCount}/{quiz.questions.length}
                      </span>{" "}
                      answered
                    </div>
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground"
                    >
                      <Menu className="h-4 w-4" />
                      Question list
                    </button>
                  </div>
                </Card>
              </div>

              <aside className="hidden xl:block">
                <Card className="sticky top-24 border-border bg-white" padding="lg">
                  <p className="text-xs font-semibold uppercase font-medium text-muted-foreground">
                    Attempt status
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Duration</span>
                      <span className="font-semibold text-foreground">
                        {formatQuizMinutes(quiz.duration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Passing score</span>
                      <span className="font-semibold text-foreground">
                        {QUIZ_PASS_PERCENT}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Answered</span>
                      <span className="font-semibold text-foreground">
                        {answeredCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Unanswered</span>
                      <span className="font-semibold text-foreground">
                        {unansweredCount}
                      </span>
                    </div>
                  </div>
                </Card>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <SubmitConfirmModal
        open={showSubmitConfirm}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => void submitAttempt(false)}
      />
    </div>
  );
}

function QuestionSidebar({
  quizTitle,
  currentIndex,
  questions,
  answersByQuestionId,
  onSelect,
  onClose,
}: {
  quizTitle: string;
  currentIndex: number;
  questions: QuizAttemptRecord["questions"];
  answersByQuestionId: Record<string, string | null>;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const answeredCount = Object.values(answersByQuestionId).filter(Boolean).length;

  return (
    <div className="flex h-full flex-col border-r border-border bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase font-medium text-muted-foreground">
            Question list
          </p>
          <h2 className="mt-1 line-clamp-2 text-lg font-bold text-foreground">
            {quizTitle}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-4">
        <Card className="border-border bg-muted" padding="md">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Answered</span>
            <strong className="text-foreground">
              {answeredCount}/{questions.length}
            </strong>
          </div>
        </Card>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4">
          {questions.map((question, index) => {
            const answered = Boolean(answersByQuestionId[question.id]);
            const active = index === currentIndex;

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => onSelect(index)}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition",
                  active
                    ? "border-primary bg-accent text-primary"
                    : answered
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-border bg-white text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="text-sm">{index + 1}</span>
                <span className="text-[10px] font-medium">
                  {active ? "Current" : answered ? "Selected" : "Unanswered"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
