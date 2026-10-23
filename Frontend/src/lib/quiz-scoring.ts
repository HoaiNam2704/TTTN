export const QUIZ_MAX_SCORE = 100;
export const QUIZ_PASS_PERCENT = 70;

export function calcQuizScorePercent(correctCount: number, totalQuestions: number) {
  if (totalQuestions <= 0) {
    return 0;
  }
  return Math.round((correctCount * 100) / totalQuestions);
}

export function isQuizPassed(scorePercent: number) {
  return scorePercent >= QUIZ_PASS_PERCENT;
}
