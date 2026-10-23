package vhuwng.itisacademy.Quiz;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vhuwng.itisacademy.Quiz.dto.CreateQuizRequestDto;
import vhuwng.itisacademy.Quiz.dto.QuizResponseDto;
import vhuwng.itisacademy.Quiz.dto.UpdateQuizRequestDto;

@RestController
@RequestMapping("/admin/quizzes")
public class AdminQuizController {

    private final QuizService quizService;

    public AdminQuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @PostMapping
    public ResponseEntity<QuizResponseDto> createQuiz(
            @Valid @RequestBody CreateQuizRequestDto createQuizRequestDto) {
        return ResponseEntity.ok(quizService.createQuiz(createQuizRequestDto));
    }

    @PatchMapping("/{quizId}")
    public ResponseEntity<QuizResponseDto> updateQuiz(
            @PathVariable("quizId") UUID quizId,
            @Valid @RequestBody UpdateQuizRequestDto updateQuizRequestDto) {
        return ResponseEntity.ok(quizService.updateQuiz(quizId, updateQuizRequestDto));
    }

    @PatchMapping("/{quizId}/publish")
    public ResponseEntity<QuizResponseDto> publishQuiz(@PathVariable("quizId") UUID quizId) {
        return ResponseEntity.ok(quizService.publishQuiz(quizId));
    }

    @PatchMapping("/{quizId}/unpublish")
    public ResponseEntity<QuizResponseDto> unpublishQuiz(@PathVariable("quizId") UUID quizId) {
        return ResponseEntity.ok(quizService.unpublishQuiz(quizId));
    }

    @DeleteMapping("/{quizId}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable("quizId") UUID quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.noContent().build();
    }
}
