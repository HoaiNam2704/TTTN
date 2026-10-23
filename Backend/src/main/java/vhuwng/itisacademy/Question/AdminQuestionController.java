package vhuwng.itisacademy.Question;

import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vhuwng.itisacademy.Question.dto.CreateQuestionRequestDto;
import vhuwng.itisacademy.Question.dto.QuestionDetailResponseDto;
import vhuwng.itisacademy.Question.dto.QuestionResponseDto;
import vhuwng.itisacademy.Question.dto.UpdateQuestionRequestDto;

@RestController
@RequestMapping("/admin/questions")
public class AdminQuestionController {

    private final QuestionService questionService;

    public AdminQuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping
    public ResponseEntity<Page<QuestionResponseDto>> getQuestions(
            @RequestParam(name = "quizId", required = false) UUID quizId,
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(questionService.getQuestions(quizId, pageable));
    }

    @GetMapping("/{questionId}")
    public ResponseEntity<QuestionDetailResponseDto> getQuestionById(@PathVariable("questionId") UUID questionId) {
        return ResponseEntity.ok(questionService.getQuestionById(questionId));
    }

    @PostMapping
    public ResponseEntity<QuestionDetailResponseDto> createQuestion(
            @Valid @RequestBody CreateQuestionRequestDto createQuestionRequestDto) {
        return ResponseEntity.ok(questionService.createQuestion(createQuestionRequestDto));
    }

    @PatchMapping("/{questionId}")
    public ResponseEntity<QuestionDetailResponseDto> updateQuestion(
            @PathVariable("questionId") UUID questionId,
            @Valid @RequestBody UpdateQuestionRequestDto updateQuestionRequestDto) {
        return ResponseEntity.ok(questionService.updateQuestion(questionId, updateQuestionRequestDto));
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable("questionId") UUID questionId) {
        questionService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}
