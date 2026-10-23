package vhuwng.itisacademy.QuizOption;

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
import vhuwng.itisacademy.QuizOption.dto.CreateQuizOptionRequestDto;
import vhuwng.itisacademy.QuizOption.dto.QuizOptionResponseDto;
import vhuwng.itisacademy.QuizOption.dto.UpdateQuizOptionRequestDto;

@RestController
@RequestMapping("/admin/options")
public class AdminQuizOptionController {

    private final QuizOptionService quizOptionService;

    public AdminQuizOptionController(QuizOptionService quizOptionService) {
        this.quizOptionService = quizOptionService;
    }

    @GetMapping
    public ResponseEntity<Page<QuizOptionResponseDto>> getOptions(
            @RequestParam(name = "questionId", required = false) UUID questionId,
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ResponseEntity.ok(quizOptionService.getOptions(questionId, pageable));
    }

    @GetMapping("/{optionId}")
    public ResponseEntity<QuizOptionResponseDto> getOptionById(@PathVariable("optionId") UUID optionId) {
        return ResponseEntity.ok(quizOptionService.getOptionById(optionId));
    }

    @PostMapping
    public ResponseEntity<QuizOptionResponseDto> createOption(
            @Valid @RequestBody CreateQuizOptionRequestDto createQuizOptionRequestDto) {
        return ResponseEntity.ok(quizOptionService.createOption(createQuizOptionRequestDto));
    }

    @PatchMapping("/{optionId}")
    public ResponseEntity<QuizOptionResponseDto> updateOption(
            @PathVariable("optionId") UUID optionId,
            @Valid @RequestBody UpdateQuizOptionRequestDto updateQuizOptionRequestDto) {
        return ResponseEntity.ok(quizOptionService.updateOption(optionId, updateQuizOptionRequestDto));
    }

    @DeleteMapping("/{optionId}")
    public ResponseEntity<Void> deleteOption(@PathVariable("optionId") UUID optionId) {
        quizOptionService.deleteOption(optionId);
        return ResponseEntity.noContent().build();
    }
}
