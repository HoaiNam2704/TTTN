package vhuwng.itisacademy.Topic;

import org.mapstruct.Mapper;

import vhuwng.itisacademy.Topic.dto.TopicResponseDto;
import vhuwng.itisacademy.Topic.entity.Topic;

@Mapper(componentModel = "spring")
public interface TopicMapper {

    default TopicResponseDto toDto(Topic topic) {
        return toDto(topic, 0L);
    }

    default TopicResponseDto toDto(Topic topic, long quizCount) {
        if (topic == null) {
            return null;
        }
        return new TopicResponseDto(
                topic.getId(),
                topic.getName(),
                topic.getDescription(),
                quizCount);
    }
}
