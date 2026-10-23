package vhuwng.itisacademy.QuizOption;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.QuizOption.dto.CreateQuizOptionRequestDto;
import vhuwng.itisacademy.QuizOption.dto.QuizOptionResponseDto;
import vhuwng.itisacademy.QuizOption.dto.UpdateQuizOptionRequestDto;

public interface QuizOptionService {

    Page<QuizOptionResponseDto> getOptions(UUID questionId, Pageable pageable);

    QuizOptionResponseDto getOptionById(UUID optionId);

    QuizOptionResponseDto createOption(CreateQuizOptionRequestDto createQuizOptionRequestDto);

    QuizOptionResponseDto updateOption(UUID optionId, UpdateQuizOptionRequestDto updateQuizOptionRequestDto);

    void deleteOption(UUID optionId);
}
