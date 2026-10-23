package vhuwng.itisacademy.Topic;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vhuwng.itisacademy.Topic.dto.CreateTopicRequestDto;
import vhuwng.itisacademy.Topic.dto.TopicDetailResponseDto;
import vhuwng.itisacademy.Topic.dto.TopicFilter;
import vhuwng.itisacademy.Topic.dto.TopicResponseDto;
import vhuwng.itisacademy.Topic.dto.UpdateTopicRequestDto;

public interface TopicService {

    Page<TopicResponseDto> getTopics(TopicFilter filter, Pageable pageable);

    TopicDetailResponseDto getTopicById(UUID topicId);

    TopicResponseDto createTopic(CreateTopicRequestDto createTopicRequestDto);

    TopicResponseDto updateTopic(UUID topicId, UpdateTopicRequestDto updateTopicRequestDto);

    void deleteTopic(UUID topicId);
}
