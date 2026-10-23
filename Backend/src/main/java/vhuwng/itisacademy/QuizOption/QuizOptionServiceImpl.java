package vhuwng.itisacademy.QuizOption;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Question.entity.Question;
import vhuwng.itisacademy.QuizOption.dto.CreateQuizOptionRequestDto;
import vhuwng.itisacademy.QuizOption.dto.QuizOptionResponseDto;
import vhuwng.itisacademy.QuizOption.dto.UpdateQuizOptionRequestDto;
import vhuwng.itisacademy.QuizOption.entity.QuizOption;

@Service
public class QuizOptionServiceImpl implements QuizOptionService {

    private final QuizOptionRepository quizOptionRepository;
    private final QuizOptionMapper quizOptionMapper;
    private final QuizOptionUtil quizOptionUtil;

    public QuizOptionServiceImpl(QuizOptionRepository quizOptionRepository,
                                 QuizOptionMapper quizOptionMapper,
                                 QuizOptionUtil quizOptionUtil) {
        this.quizOptionRepository = quizOptionRepository;
        this.quizOptionMapper = quizOptionMapper;
        this.quizOptionUtil = quizOptionUtil;
    }

    @Override
    @Transactional
    public Page<QuizOptionResponseDto> getOptions(UUID questionId, Pageable pageable) {
        Page<QuizOption> options = questionId == null
                ? quizOptionRepository.findAll(pageable)
                : quizOptionRepository.findByQuestionId(questionId, pageable);
        return options.map(quizOptionMapper::toDto);
    }

    @Override
    @Transactional
    public QuizOptionResponseDto getOptionById(UUID optionId) {
        return quizOptionMapper.toDto(quizOptionUtil.findOptionOrThrow(optionId));
    }

    @Override
    @Transactional
    public QuizOptionResponseDto createOption(CreateQuizOptionRequestDto createQuizOptionRequestDto) {
        Question question = quizOptionUtil.findQuestionOrThrow(createQuizOptionRequestDto.questionId());
        QuizOption option = new QuizOption();
        option.setQuestion(question);
        option.setContent(createQuizOptionRequestDto.content().trim());
        option.setCorrect(Boolean.TRUE.equals(createQuizOptionRequestDto.isCorrect()));
        return quizOptionMapper.toDto(quizOptionRepository.save(option));
    }

    @Override
    @Transactional
    public QuizOptionResponseDto updateOption(UUID optionId, UpdateQuizOptionRequestDto updateQuizOptionRequestDto) {
        QuizOption option = quizOptionUtil.findOptionOrThrow(optionId);
        if (updateQuizOptionRequestDto.questionId() != null) {
            option.setQuestion(quizOptionUtil.findQuestionOrThrow(updateQuizOptionRequestDto.questionId()));
        }
        if (updateQuizOptionRequestDto.content() != null) {
            option.setContent(updateQuizOptionRequestDto.content().trim());
        }
        if (updateQuizOptionRequestDto.isCorrect() != null) {
            option.setCorrect(updateQuizOptionRequestDto.isCorrect());
        }
        return quizOptionMapper.toDto(quizOptionRepository.save(option));
    }

    @Override
    @Transactional
    public void deleteOption(UUID optionId) {
        QuizOption option = quizOptionUtil.findOptionOrThrow(optionId);
        option.softDelete();
        quizOptionRepository.save(option);
    }
}
