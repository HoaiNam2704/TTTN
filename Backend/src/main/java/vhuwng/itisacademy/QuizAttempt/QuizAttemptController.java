package vhuwng.itisacademy.QuizAttempt;

import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vhuwng.itisacademy.QuizAttempt.dto.QuizAttemptDetailResponseDto;
import vhuwng.itisacademy.QuizAttempt.dto.QuizAttemptHistoryResponseDto;
import vhuwng.itisacademy.QuizAttempt.dto.SubmitQuizAttemptRequestDto;

@RestController
@RequestMapping("/quiz-attempts")
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;

    public QuizAttemptController(QuizAttemptService quizAttemptService) {
        this.quizAttemptService = quizAttemptService;
    }

    @PostMapping
    public ResponseEntity<QuizAttemptDetailResponseDto> submitAttempt(
            @Valid @RequestBody SubmitQuizAttemptRequestDto request) {
        return ResponseEntity.ok(quizAttemptService.submitAttempt(request));
    }

    @GetMapping
    public ResponseEntity<Page<QuizAttemptHistoryResponseDto>> getMyAttempts(
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "submittedAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(quizAttemptService.getMyAttempts(pageable));
    }

    @GetMapping("/{attemptId}")
    public ResponseEntity<QuizAttemptDetailResponseDto> getAttemptById(@PathVariable("attemptId") UUID attemptId) {
        return ResponseEntity.ok(quizAttemptService.getAttemptById(attemptId));
    }

    @GetMapping("/latest")
    public ResponseEntity<QuizAttemptDetailResponseDto> getLatestAttemptByQuizId(
            @RequestParam("quizId") UUID quizId) {
        return ResponseEntity.ok(quizAttemptService.getLatestAttemptByQuizId(quizId));
    }
}
