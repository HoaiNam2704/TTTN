package vhuwng.itisacademy.Topic;

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
import vhuwng.itisacademy.Topic.dto.CreateTopicRequestDto;
import vhuwng.itisacademy.Topic.dto.TopicResponseDto;
import vhuwng.itisacademy.Topic.dto.UpdateTopicRequestDto;

@RestController
@RequestMapping("/admin/topics")
public class AdminTopicController {

    private final TopicService topicService;

    public AdminTopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @PostMapping
    public ResponseEntity<TopicResponseDto> createTopic(
            @Valid @RequestBody CreateTopicRequestDto createTopicRequestDto) {
        return ResponseEntity.ok(topicService.createTopic(createTopicRequestDto));
    }

    @PatchMapping("/{topicId}")
    public ResponseEntity<TopicResponseDto> updateTopic(
            @PathVariable("topicId") UUID topicId,
            @Valid @RequestBody UpdateTopicRequestDto updateTopicRequestDto) {
        return ResponseEntity.ok(topicService.updateTopic(topicId, updateTopicRequestDto));
    }

    @DeleteMapping("/{topicId}")
    public ResponseEntity<Void> deleteTopic(@PathVariable("topicId") UUID topicId) {
        topicService.deleteTopic(topicId);
        return ResponseEntity.noContent().build();
    }
}
