package vhuwng.itisacademy.Topic;

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

import vhuwng.itisacademy.Topic.dto.TopicDetailResponseDto;
import vhuwng.itisacademy.Topic.dto.TopicFilter;
import vhuwng.itisacademy.Topic.dto.TopicResponseDto;

@RestController
@RequestMapping("/topics")
public class TopicController {

    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping
    public ResponseEntity<Page<TopicResponseDto>> getTopics(
            @RequestParam(required = false) String search,
            @ParameterObject
            @PageableDefault(size = 10, page = 0, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        TopicFilter filter = new TopicFilter(search);
        return ResponseEntity.ok(topicService.getTopics(filter, pageable));
    }

    @GetMapping("/{topicId}")
    public ResponseEntity<TopicDetailResponseDto> getTopicById(@PathVariable("topicId") UUID topicId) {
        return ResponseEntity.ok(topicService.getTopicById(topicId));
    }
}
