package vhuwng.itisacademy.Quiz;

public final class QuizScoring {

    public static final int MAX_SCORE = 100;
    public static final int PASS_PERCENT = 70;

    private QuizScoring() {
    }

    public static int scorePercent(int correctCount, int totalQuestions) {
        if (totalQuestions <= 0) {
            return 0;
        }
        return Math.round((correctCount * 100f) / totalQuestions);
    }

    public static boolean isPassed(int scorePercent) {
        return scorePercent >= PASS_PERCENT;
    }
}
