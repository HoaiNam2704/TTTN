package vhuwng.itisacademy.QuizAttempt;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Question.QuestionRepository;
import vhuwng.itisacademy.Question.dto.QuestionDetailResponseDto;
import vhuwng.itisacademy.Question.entity.Question;
import vhuwng.itisacademy.Quiz.QuizScoring;
import vhuwng.itisacademy.Quiz.entity.Quiz;
import vhuwng.itisacademy.QuizAttempt.dto.QuizAttemptDetailResponseDto;
import vhuwng.itisacademy.QuizAttempt.dto.QuizAttemptHistoryResponseDto;
import vhuwng.itisacademy.QuizAttempt.dto.SubmitQuizAttemptRequestDto;
import vhuwng.itisacademy.QuizAttempt.entity.QuizAttempt;
import vhuwng.itisacademy.User.UserRepository;
import vhuwng.itisacademy.User.entity.User;
import vhuwng.itisacademy.common.exception.ForbiddenException;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Service
public class QuizAttemptServiceImpl implements QuizAttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final QuizAttemptUtil quizAttemptUtil;

    public QuizAttemptServiceImpl(QuizAttemptRepository quizAttemptRepository,
                                  QuestionRepository questionRepository,
                                  UserRepository userRepository,
                                  QuizAttemptUtil quizAttemptUtil) {
        this.quizAttemptRepository = quizAttemptRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.quizAttemptUtil = quizAttemptUtil;
    }

    @Override
    @Transactional
    public QuizAttemptDetailResponseDto submitAttempt(SubmitQuizAttemptRequestDto request) {
        UUID currentUserId = quizAttemptUtil.requireCurrentUserId();
        Quiz quiz = quizAttemptUtil.findQuizOrThrow(request.quizId());
        if (!quiz.isPublished()) {
            throw new ForbiddenException("Quiz is not published");
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Question> questions = questionRepository.findByQuizId(quiz.getId());
        if (questions.isEmpty()) {
            throw new IllegalArgumentException("Quiz has no questions");
        }

        Map<UUID, UUID> answersByQuestionId = quizAttemptUtil.normalizeAnswers(request.answersByQuestionId(), questions);
        List<QuestionDetailResponseDto> questionSnapshots = quizAttemptUtil.buildQuestionSnapshots(questions);
        Map<UUID, UUID> correctAnswerByQuestionId = quizAttemptUtil.buildCorrectAnswerMap(questions);

        int correctCount = 0;
        int incorrectCount = 0;

        for (Question question : questions) {
            UUID selectedOptionId = answersByQuestionId.get(question.getId());
            UUID correctOptionId = correctAnswerByQuestionId.get(question.getId());
            boolean isCorrect = correctOptionId != null && correctOptionId.equals(selectedOptionId);

            if (isCorrect) {
                correctCount += 1;
            } else {
                incorrectCount += 1;
            }
        }

        int totalQuestions = questions.size();
        int scorePercent = QuizScoring.scorePercent(correctCount, totalQuestions);
        boolean passed = QuizScoring.isPassed(scorePercent);
        Instant submittedAt = Instant.now();
        int elapsedSeconds = Math.max((int) Duration.between(request.startedAt(), submittedAt).getSeconds(), 0);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setUser(user);
        attempt.setQuiz(quiz);
        attempt.setStartedAt(request.startedAt());
        attempt.setSubmittedAt(submittedAt);
        attempt.setElapsedSeconds(elapsedSeconds);
        attempt.setTotalQuestions(totalQuestions);
        // Keep columns for API compatibility: max score is always 100, scorePoints mirrors percent.
        attempt.setTotalPoints(QuizScoring.MAX_SCORE);
        attempt.setCorrectCount(correctCount);
        attempt.setIncorrectCount(incorrectCount);
        attempt.setScorePoints(scorePercent);
        attempt.setScorePercent(scorePercent);
        attempt.setPassed(passed);
        attempt.setAnswersJson(quizAttemptUtil.writeJson(answersByQuestionId));
        attempt.setQuestionsJson(quizAttemptUtil.writeJson(questionSnapshots));

        QuizAttempt saved = quizAttemptRepository.save(attempt);
        return quizAttemptUtil.toDetailDto(saved, answersByQuestionId, questionSnapshots);
    }

    @Override
    @Transactional
    public Page<QuizAttemptHistoryResponseDto> getMyAttempts(Pageable pageable) {
        UUID currentUserId = quizAttemptUtil.requireCurrentUserId();
        return quizAttemptRepository.findByUserId(currentUserId, pageable)
                .map(quizAttemptUtil::toHistoryDto);
    }

    @Override
    @Transactional
    public QuizAttemptDetailResponseDto getAttemptById(UUID attemptId) {
        UUID currentUserId = quizAttemptUtil.requireCurrentUserId();
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUserId(attemptId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz attempt not found"));
        return quizAttemptUtil.toDetailDto(attempt);
    }

    @Override
    @Transactional
    public QuizAttemptDetailResponseDto getLatestAttemptByQuizId(UUID quizId) {
        UUID currentUserId = quizAttemptUtil.requireCurrentUserId();
        QuizAttempt attempt = quizAttemptRepository.findFirstByUserIdAndQuizIdOrderBySubmittedAtDesc(currentUserId, quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz attempt not found"));
        return quizAttemptUtil.toDetailDto(attempt);
    }
}
