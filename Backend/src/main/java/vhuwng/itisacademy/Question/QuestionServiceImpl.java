package vhuwng.itisacademy.Question;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Question.dto.CreateQuestionRequestDto;
import vhuwng.itisacademy.Question.dto.QuestionDetailResponseDto;
import vhuwng.itisacademy.Question.dto.QuestionResponseDto;
import vhuwng.itisacademy.Question.dto.UpdateQuestionRequestDto;
import vhuwng.itisacademy.Question.entity.Question;
import vhuwng.itisacademy.Quiz.entity.Quiz;
import vhuwng.itisacademy.QuizOption.QuizOptionRepository;

@Service
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final QuestionMapper questionMapper;
    private final QuestionUtil questionUtil;

    public QuestionServiceImpl(QuestionRepository questionRepository,
                               QuizOptionRepository quizOptionRepository,
                               QuestionMapper questionMapper,
                               QuestionUtil questionUtil) {
        this.questionRepository = questionRepository;
        this.quizOptionRepository = quizOptionRepository;
        this.questionMapper = questionMapper;
        this.questionUtil = questionUtil;
    }

    @Override
    @Transactional
    public Page<QuestionResponseDto> getQuestions(UUID quizId, Pageable pageable) {
        Page<Question> questions = quizId == null
                ? questionRepository.findAll(pageable)
                : questionRepository.findByQuizId(quizId, pageable);
        return questions.map(questionMapper::toDto);
    }

    @Override
    @Transactional
    public QuestionDetailResponseDto getQuestionById(UUID questionId) {
        return questionUtil.toDetailDto(questionUtil.findQuestionOrThrow(questionId));
    }

    @Override
    @Transactional
    public QuestionDetailResponseDto createQuestion(CreateQuestionRequestDto createQuestionRequestDto) {
        Quiz quiz = questionUtil.findQuizOrThrow(createQuestionRequestDto.quizId());
        Question question = new Question();
        question.setQuiz(quiz);
        question.setContent(createQuestionRequestDto.content().trim());
        question.setExplanation(questionUtil.normalizeText(createQuestionRequestDto.explanation()));
        return questionUtil.toDetailDto(questionRepository.save(question));
    }

    @Override
    @Transactional
    public QuestionDetailResponseDto updateQuestion(UUID questionId, UpdateQuestionRequestDto updateQuestionRequestDto) {
        Question question = questionUtil.findQuestionOrThrow(questionId);
        if (updateQuestionRequestDto.quizId() != null) {
            question.setQuiz(questionUtil.findQuizOrThrow(updateQuestionRequestDto.quizId()));
        }
        if (updateQuestionRequestDto.content() != null) {
            question.setContent(updateQuestionRequestDto.content().trim());
        }
        if (updateQuestionRequestDto.explanation() != null) {
            question.setExplanation(questionUtil.normalizeText(updateQuestionRequestDto.explanation()));
        }
        return questionUtil.toDetailDto(questionRepository.save(question));
    }

    @Override
    @Transactional
    public void deleteQuestion(UUID questionId) {
        Question question = questionUtil.findQuestionOrThrow(questionId);
        quizOptionRepository.findByQuestionId(questionId).forEach(option -> {
            option.softDelete();
            quizOptionRepository.save(option);
        });
        question.softDelete();
        questionRepository.save(question);
    }
}
