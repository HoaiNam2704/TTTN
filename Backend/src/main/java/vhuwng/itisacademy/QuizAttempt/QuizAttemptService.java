package vhuwng.itisacademy.QuizAttempt;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.QuizAttempt.dto.QuizAttemptDetailResponseDto;
import vhuwng.itisacademy.QuizAttempt.dto.QuizAttemptHistoryResponseDto;
import vhuwng.itisacademy.QuizAttempt.dto.SubmitQuizAttemptRequestDto;

public interface QuizAttemptService {

    QuizAttemptDetailResponseDto submitAttempt(SubmitQuizAttemptRequestDto request);

    Page<QuizAttemptHistoryResponseDto> getMyAttempts(Pageable pageable);

    QuizAttemptDetailResponseDto getAttemptById(UUID attemptId);

    QuizAttemptDetailResponseDto getLatestAttemptByQuizId(UUID quizId);
}
