package vhuwng.itisacademy.Quiz;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Question.QuestionRepository;
import vhuwng.itisacademy.Question.dto.QuestionDetailResponseDto;
import vhuwng.itisacademy.Quiz.dto.CreateQuizRequestDto;
import vhuwng.itisacademy.Quiz.dto.QuizDetailResponseDto;
import vhuwng.itisacademy.Quiz.dto.QuizFilter;
import vhuwng.itisacademy.Quiz.dto.QuizResponseDto;
import vhuwng.itisacademy.Quiz.dto.UpdateQuizRequestDto;
import vhuwng.itisacademy.Quiz.entity.Quiz;
import vhuwng.itisacademy.Topic.entity.Topic;

@Service
public class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizMapper quizMapper;
    private final QuizUtil quizUtil;

    public QuizServiceImpl(QuizRepository quizRepository,
                           QuestionRepository questionRepository,
                           QuizMapper quizMapper,
                           QuizUtil quizUtil) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.quizMapper = quizMapper;
        this.quizUtil = quizUtil;
    }

    @Override
    @Transactional
    public Page<QuizResponseDto> getQuizzes(QuizFilter filter, Pageable pageable) {
        return quizRepository.findAll(QuizSpecification.filter(filter), pageable).map(quizMapper::toDto);
    }

    @Override
    @Transactional
    public QuizDetailResponseDto getQuizById(UUID quizId) {
        Quiz quiz = quizUtil.findQuizOrThrow(quizId);
        List<QuestionDetailResponseDto> questions = questionRepository.findByQuizId(quizId).stream()
                .map(quizUtil::toQuestionDetailDto)
                .toList();
        return new QuizDetailResponseDto(
                quiz.getId(),
                quiz.getTopic().getId(),
                quiz.getTopic().getName(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getDuration(),
                QuizScoring.PASS_PERCENT,
                quiz.isPublished(),
                questions);
    }

    @Override
    @Transactional
    public QuizResponseDto createQuiz(CreateQuizRequestDto createQuizRequestDto) {
        Topic topic = quizUtil.findTopicOrThrow(createQuizRequestDto.topicId());
        Quiz quiz = new Quiz();
        quiz.setTopic(topic);
        quiz.setTitle(createQuizRequestDto.title().trim());
        quiz.setDescription(quizUtil.normalizeText(createQuizRequestDto.description()));
        quiz.setDuration(createQuizRequestDto.duration());
        quiz.setPassingScore(QuizScoring.PASS_PERCENT);
        quiz.setPublished(Boolean.TRUE.equals(createQuizRequestDto.isPublished()));
        return quizMapper.toDto(quizRepository.save(quiz));
    }

    @Override
    @Transactional
    public QuizResponseDto updateQuiz(UUID quizId, UpdateQuizRequestDto updateQuizRequestDto) {
        Quiz quiz = quizUtil.findQuizOrThrow(quizId);
        if (updateQuizRequestDto.topicId() != null) {
            quiz.setTopic(quizUtil.findTopicOrThrow(updateQuizRequestDto.topicId()));
        }
        if (updateQuizRequestDto.title() != null) {
            quiz.setTitle(updateQuizRequestDto.title().trim());
        }
        if (updateQuizRequestDto.description() != null) {
            quiz.setDescription(quizUtil.normalizeText(updateQuizRequestDto.description()));
        }
        if (updateQuizRequestDto.duration() != null) {
            quiz.setDuration(updateQuizRequestDto.duration());
        }
        quiz.setPassingScore(QuizScoring.PASS_PERCENT);
        if (updateQuizRequestDto.isPublished() != null) {
            quiz.setPublished(updateQuizRequestDto.isPublished());
        }
        return quizMapper.toDto(quizRepository.save(quiz));
    }

    @Override
    @Transactional
    public QuizResponseDto publishQuiz(UUID quizId) {
        Quiz quiz = quizUtil.findQuizOrThrow(quizId);
        quiz.setPublished(true);
        return quizMapper.toDto(quizRepository.save(quiz));
    }

    @Override
    @Transactional
    public QuizResponseDto unpublishQuiz(UUID quizId) {
        Quiz quiz = quizUtil.findQuizOrThrow(quizId);
        quiz.setPublished(false);
        return quizMapper.toDto(quizRepository.save(quiz));
    }

    @Override
    @Transactional
    public void deleteQuiz(UUID quizId) {
        Quiz quiz = quizUtil.findQuizOrThrow(quizId);
        questionRepository.findByQuizId(quizId).forEach(question -> quizUtil.softDeleteQuestion(question.getId()));
        quiz.softDelete();
        quizRepository.save(quiz);
    }
}
