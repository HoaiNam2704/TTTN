package vhuwng.itisacademy.Quiz;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Question.QuestionRepository;
import vhuwng.itisacademy.Question.dto.QuestionDetailResponseDto;
import vhuwng.itisacademy.Question.entity.Question;
import vhuwng.itisacademy.Quiz.entity.Quiz;
import vhuwng.itisacademy.QuizOption.QuizOptionMapper;
import vhuwng.itisacademy.QuizOption.QuizOptionRepository;
import vhuwng.itisacademy.Topic.TopicRepository;
import vhuwng.itisacademy.Topic.entity.Topic;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class QuizUtil {

    private final QuizRepository quizRepository;
    private final TopicRepository topicRepository;
    private final QuestionRepository questionRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final QuizOptionMapper quizOptionMapper;

    public QuizUtil(QuizRepository quizRepository,
                    TopicRepository topicRepository,
                    QuestionRepository questionRepository,
                    QuizOptionRepository quizOptionRepository,
                    QuizOptionMapper quizOptionMapper) {
        this.quizRepository = quizRepository;
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.quizOptionRepository = quizOptionRepository;
        this.quizOptionMapper = quizOptionMapper;
    }

    public Quiz findQuizOrThrow(UUID quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
    }

    public Topic findTopicOrThrow(UUID topicId) {
        return topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));
    }

    public QuestionDetailResponseDto toQuestionDetailDto(Question question) {
        return new QuestionDetailResponseDto(
                question.getId(),
                question.getQuiz().getId(),
                question.getContent(),
                question.getExplanation(),
                quizOptionRepository.findByQuestionId(question.getId()).stream()
                        .map(quizOptionMapper::toDto)
                        .toList());
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
