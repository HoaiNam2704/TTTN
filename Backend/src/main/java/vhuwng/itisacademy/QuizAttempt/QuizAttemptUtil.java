package vhuwng.itisacademy.QuizAttempt;

import java.io.IOException;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Question.dto.QuestionDetailResponseDto;
import vhuwng.itisacademy.Question.entity.Question;
import vhuwng.itisacademy.Quiz.QuizRepository;
import vhuwng.itisacademy.Quiz.QuizScoring;
import vhuwng.itisacademy.Quiz.entity.Quiz;
import vhuwng.itisacademy.QuizAttempt.dto.QuizAttemptDetailResponseDto;
import vhuwng.itisacademy.QuizAttempt.dto.QuizAttemptHistoryResponseDto;
import vhuwng.itisacademy.QuizAttempt.entity.QuizAttempt;
import vhuwng.itisacademy.QuizOption.QuizOptionMapper;
import vhuwng.itisacademy.QuizOption.QuizOptionRepository;
import vhuwng.itisacademy.QuizOption.entity.QuizOption;
import vhuwng.itisacademy.Security.SecurityUtil;
import vhuwng.itisacademy.Topic.entity.Topic;
import vhuwng.itisacademy.common.exception.ForbiddenException;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class QuizAttemptUtil {

    private final QuizRepository quizRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final QuizOptionMapper quizOptionMapper;
    private final ObjectMapper objectMapper;

    public QuizAttemptUtil(QuizRepository quizRepository,
                           QuizOptionRepository quizOptionRepository,
                           QuizOptionMapper quizOptionMapper,
                           ObjectMapper objectMapper) {
        this.quizRepository = quizRepository;
        this.quizOptionRepository = quizOptionRepository;
        this.quizOptionMapper = quizOptionMapper;
        this.objectMapper = objectMapper;
    }

    public Quiz findQuizOrThrow(UUID quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
    }

    public UUID requireCurrentUserId() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        if (currentUserId == null) {
            throw new ForbiddenException("Authentication required");
        }
        return currentUserId;
    }

    public QuizAttemptHistoryResponseDto toHistoryDto(QuizAttempt attempt) {
        Quiz quiz = attempt.getQuiz();
        Topic topic = quiz.getTopic();
        return new QuizAttemptHistoryResponseDto(
                attempt.getId(),
                quiz.getId(),
                topic.getId(),
                topic.getName(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getDuration(),
                QuizScoring.PASS_PERCENT,
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                attempt.getElapsedSeconds(),
                attempt.getTotalQuestions(),
                attempt.getTotalPoints(),
                attempt.getCorrectCount(),
                attempt.getIncorrectCount(),
                attempt.getScorePoints(),
                attempt.getScorePercent(),
                attempt.isPassed());
    }

    public QuizAttemptDetailResponseDto toDetailDto(QuizAttempt attempt) {
        Map<UUID, UUID> answersByQuestionId = readAnswers(attempt.getAnswersJson());
        List<QuestionDetailResponseDto> questions = readQuestions(attempt.getQuestionsJson());
        return toDetailDto(attempt, answersByQuestionId, questions);
    }

    public QuizAttemptDetailResponseDto toDetailDto(QuizAttempt attempt,
                                                    Map<UUID, UUID> answersByQuestionId,
                                                    List<QuestionDetailResponseDto> questions) {
        Quiz quiz = attempt.getQuiz();
        Topic topic = quiz.getTopic();
        return new QuizAttemptDetailResponseDto(
                attempt.getId(),
                quiz.getId(),
                topic.getId(),
                topic.getName(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getDuration(),
                QuizScoring.PASS_PERCENT,
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                attempt.getElapsedSeconds(),
                attempt.getTotalQuestions(),
                attempt.getTotalPoints(),
                attempt.getCorrectCount(),
                attempt.getIncorrectCount(),
                attempt.getScorePoints(),
                attempt.getScorePercent(),
                attempt.isPassed(),
                answersByQuestionId,
                questions);
    }

    public Map<UUID, UUID> normalizeAnswers(Map<UUID, UUID> submittedAnswers, List<Question> questions) {
        Map<UUID, UUID> answersByQuestionId = new LinkedHashMap<>();
        for (Question question : questions) {
            answersByQuestionId.put(question.getId(), submittedAnswers.get(question.getId()));
        }
        return answersByQuestionId;
    }

    public Map<UUID, UUID> buildCorrectAnswerMap(List<Question> questions) {
        Map<UUID, UUID> correctAnswers = new HashMap<>();
        for (Question question : questions) {
            UUID correctOptionId = quizOptionRepository.findByQuestionId(question.getId()).stream()
                    .filter(QuizOption::isCorrect)
                    .map(QuizOption::getId)
                    .findFirst()
                    .orElse(null);
            correctAnswers.put(question.getId(), correctOptionId);
        }
        return correctAnswers;
    }

    public List<QuestionDetailResponseDto> buildQuestionSnapshots(List<Question> questions) {
        return questions.stream()
                .map(question -> new QuestionDetailResponseDto(
                        question.getId(),
                        question.getQuiz().getId(),
                        question.getContent(),
                        question.getExplanation(),
                        quizOptionRepository.findByQuestionId(question.getId()).stream()
                                .sorted(Comparator.comparing(QuizOption::getCreatedAt))
                                .map(quizOptionMapper::toDto)
                                .toList()))
                .toList();
    }

    public Map<UUID, UUID> readAnswers(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<UUID, UUID>>() {});
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to parse quiz attempt answers", ex);
        }
    }

    public List<QuestionDetailResponseDto> readQuestions(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<QuestionDetailResponseDto>>() {});
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to parse quiz attempt questions", ex);
        }
    }

    public String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to serialize quiz attempt payload", ex);
        }
    }
}
