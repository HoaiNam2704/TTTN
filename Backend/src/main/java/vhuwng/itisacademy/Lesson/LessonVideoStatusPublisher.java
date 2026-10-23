package vhuwng.itisacademy.Lesson;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vhuwng.itisacademy.Lesson.dto.VideoStatusUpdateDto;
import vhuwng.itisacademy.Lesson.entity.Lesson;

@Slf4j
@Service
@RequiredArgsConstructor
public class LessonVideoStatusPublisher {

    public static final String TOPIC_PREFIX = "/topic/lessons/";
    public static final String TOPIC_SUFFIX = "/video-status";

    private final SimpMessagingTemplate messagingTemplate;
    private final LessonMapper lessonMapper;

    public void publish(Lesson lesson) {
        if (lesson == null || lesson.getId() == null) {
            return;
        }
        VideoStatusUpdateDto payload = lessonMapper.toStatusUpdate(lesson);
        String destination = TOPIC_PREFIX + lesson.getId() + TOPIC_SUFFIX;
        log.debug("Publishing video status lessonId={} status={} dest={}",
                lesson.getId(), payload.videoStatus(), destination);
        messagingTemplate.convertAndSend(destination, payload);
    }
}
