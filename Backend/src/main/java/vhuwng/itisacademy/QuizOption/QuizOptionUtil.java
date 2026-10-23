package vhuwng.itisacademy.QuizOption;

import java.util.UUID;

import org.springframework.stereotype.Component;

import vhuwng.itisacademy.Question.QuestionRepository;
import vhuwng.itisacademy.Question.entity.Question;
import vhuwng.itisacademy.QuizOption.entity.QuizOption;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

@Component
public class QuizOptionUtil {

    private final QuizOptionRepository quizOptionRepository;
    private final QuestionRepository questionRepository;

    public QuizOptionUtil(QuizOptionRepository quizOptionRepository, QuestionRepository questionRepository) {
        this.quizOptionRepository = quizOptionRepository;
        this.questionRepository = questionRepository;
    }

    public QuizOption findOptionOrThrow(UUID optionId) {
        return quizOptionRepository.findById(optionId)
                .orElseThrow(() -> new ResourceNotFoundException("Option not found"));
    }

    public Question findQuestionOrThrow(UUID questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
    }
}
