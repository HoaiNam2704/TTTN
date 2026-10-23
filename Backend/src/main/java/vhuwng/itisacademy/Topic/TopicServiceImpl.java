package vhuwng.itisacademy.Topic;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Quiz.QuizMapper;
import vhuwng.itisacademy.Quiz.QuizRepository;
import vhuwng.itisacademy.Quiz.dto.QuizResponseDto;
import vhuwng.itisacademy.Topic.dto.CreateTopicRequestDto;
import vhuwng.itisacademy.Topic.dto.TopicDetailResponseDto;
import vhuwng.itisacademy.Topic.dto.TopicFilter;
import vhuwng.itisacademy.Topic.dto.TopicResponseDto;
import vhuwng.itisacademy.Topic.dto.UpdateTopicRequestDto;
import vhuwng.itisacademy.Topic.entity.Topic;

@Service
public class TopicServiceImpl implements TopicService {

    private final TopicRepository topicRepository;
    private final QuizRepository quizRepository;
    private final TopicMapper topicMapper;
    private final QuizMapper quizMapper;
    private final TopicUtil topicUtil;

    public TopicServiceImpl(TopicRepository topicRepository,
                            QuizRepository quizRepository,
                            TopicMapper topicMapper,
                            QuizMapper quizMapper,
                            TopicUtil topicUtil) {
        this.topicRepository = topicRepository;
        this.quizRepository = quizRepository;
        this.topicMapper = topicMapper;
        this.quizMapper = quizMapper;
        this.topicUtil = topicUtil;
    }

    @Override
    @Transactional
    public Page<TopicResponseDto> getTopics(TopicFilter filter, Pageable pageable) {
        Page<Topic> topics = topicRepository.findAll(TopicSpecification.filter(filter), pageable);
        List<UUID> topicIds = topics.getContent().stream().map(Topic::getId).toList();
        Map<UUID, Long> quizCountByTopicId = topicUtil.countQuizzesByTopicIds(topicIds);

        return topics.map(topic -> topicMapper.toDto(
                topic,
                quizCountByTopicId.getOrDefault(topic.getId(), 0L)));
    }

    @Override
    @Transactional
    public TopicDetailResponseDto getTopicById(UUID topicId) {
        Topic topic = topicUtil.findTopicOrThrow(topicId);
        List<QuizResponseDto> quizzes = quizRepository.findByTopicId(topicId).stream()
                .map(quizMapper::toDto)
                .toList();
        return new TopicDetailResponseDto(
                topic.getId(),
                topic.getName(),
                topic.getDescription(),
                quizzes);
    }

    @Override
    @Transactional
    public TopicResponseDto createTopic(CreateTopicRequestDto createTopicRequestDto) {
        Topic topic = new Topic();
        topic.setName(createTopicRequestDto.name().trim());
        topic.setDescription(topicUtil.normalizeText(createTopicRequestDto.description()));
        return topicMapper.toDto(topicRepository.save(topic), 0L);
    }

    @Override
    @Transactional
    public TopicResponseDto updateTopic(UUID topicId, UpdateTopicRequestDto updateTopicRequestDto) {
        Topic topic = topicUtil.findTopicOrThrow(topicId);
        if (updateTopicRequestDto.name() != null) {
            topic.setName(updateTopicRequestDto.name().trim());
        }
        if (updateTopicRequestDto.description() != null) {
            topic.setDescription(topicUtil.normalizeText(updateTopicRequestDto.description()));
        }
        Topic saved = topicRepository.save(topic);
        return topicMapper.toDto(saved, quizRepository.countByTopicId(saved.getId()));
    }

    @Override
    @Transactional
    public void deleteTopic(UUID topicId) {
        Topic topic = topicUtil.findTopicOrThrow(topicId);
        quizRepository.findByTopicId(topicId).forEach(quiz -> topicUtil.softDeleteQuiz(quiz.getId()));
        topic.softDelete();
        topicRepository.save(topic);
    }
}
