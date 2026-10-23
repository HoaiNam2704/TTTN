package vhuwng.itisacademy.Topic;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Question.QuestionRepository;
import vhuwng.itisacademy.Quiz.QuizRepository;
import vhuwng.itisacademy.QuizOption.QuizOptionRepository;
import vhuwng.itisacademy.Topic.entity.Topic;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class TopicUtil {

    private final TopicRepository topicRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizOptionRepository quizOptionRepository;

    public TopicUtil(TopicRepository topicRepository,
                     QuizRepository quizRepository,
                     QuestionRepository questionRepository,
                     QuizOptionRepository quizOptionRepository) {
        this.topicRepository = topicRepository;
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.quizOptionRepository = quizOptionRepository;
    }

    public Topic findTopicOrThrow(UUID topicId) {
        return topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
    }

    public Map<UUID, Long> countQuizzesByTopicIds(List<UUID> topicIds) {
        Map<UUID, Long> quizCountByTopicId = new HashMap<>();
        if (topicIds.isEmpty()) {
            return quizCountByTopicId;
        }
        for (Object[] row : quizRepository.countGroupedByTopicIds(topicIds)) {
            quizCountByTopicId.put((UUID) row[0], (Long) row[1]);
        }
        return quizCountByTopicId;
    }

    public void softDeleteQuiz(UUID quizId) {
        questionRepository.findByQuizId(quizId).forEach(question -> softDeleteQuestion(question.getId()));
        quizRepository.findById(quizId).ifPresent(quiz -> {
            quiz.softDelete();
            quizRepository.save(quiz);
        });
    }

    public void softDeleteQuestion(UUID questionId) {
        quizOptionRepository.findByQuestionId(questionId).forEach(option -> {
            option.softDelete();
            quizOptionRepository.save(option);
        });
        questionRepository.findById(questionId).ifPresent(question -> {
            question.softDelete();
            questionRepository.save(question);
        });
    }

    public String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
