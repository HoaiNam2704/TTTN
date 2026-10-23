package vhuwng.itisacademy.Quiz;

import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vhuwng.itisacademy.Quiz.dto.QuizDetailResponseDto;
import vhuwng.itisacademy.Quiz.dto.QuizFilter;
import vhuwng.itisacademy.Quiz.dto.QuizResponseDto;

@RestController
@RequestMapping("/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping
    public ResponseEntity<Page<QuizResponseDto>> getQuizzes(
            @RequestParam(required = false) String search,
            @RequestParam(name = "topicId", required = false) UUID topicId,
            @RequestParam(required = false) Boolean isPublished,
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        QuizFilter filter = new QuizFilter(search, topicId, isPublished);
        return ResponseEntity.ok(quizService.getQuizzes(filter, pageable));
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<QuizDetailResponseDto> getQuizById(@PathVariable("quizId") UUID quizId) {
        return ResponseEntity.ok(quizService.getQuizById(quizId));
    }
}
