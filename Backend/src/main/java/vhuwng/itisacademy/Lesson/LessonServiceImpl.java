package vhuwng.itisacademy.Lesson;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import vhuwng.itisacademy.Lesson.dto.CreateLessonRequestDto;
import vhuwng.itisacademy.Lesson.dto.LessonResponseDto;
import vhuwng.itisacademy.Lesson.dto.ReorderLessonsRequestDto;
import vhuwng.itisacademy.Lesson.dto.UpdateLessonRequestDto;
import vhuwng.itisacademy.Lesson.dto.UploadSubtitleRequestDto;
import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.Section.SectionRepository;
import vhuwng.itisacademy.Section.entity.Section;
import vhuwng.itisacademy.Storage.StorageException;
import vhuwng.itisacademy.Storage.StorageService;
import vhuwng.itisacademy.Storage.dto.StorageUploadResult;
import vhuwng.itisacademy.common.enums.VideoStatus;
import vhuwng.itisacademy.common.exception.ResourceNotFoundException;

import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LessonServiceImpl implements LessonService {
    private final LessonRepository lessonRepository;
    private final StorageService storageService;
    private final SectionRepository sectionRepository;
    private final LessonUtil lessonUtil;
    private final LessonMapper lessonMapper;

    public LessonServiceImpl(
            LessonRepository lessonRepository,
            StorageService storageService,
            SectionRepository sectionRepository,
            LessonUtil lessonUtil,
            LessonMapper lessonMapper) {
        this.lessonRepository = lessonRepository;
        this.storageService = storageService;
        this.sectionRepository = sectionRepository;
        this.lessonUtil = lessonUtil;
        this.lessonMapper = lessonMapper;
    }

    @Override
    public byte[] getLessonSubtitle(UUID lessonId) {
        Lesson lesson = lessonUtil.requireWatchableLesson(lessonId);

        String subtitleKey = lesson.getSubtitleStorageKey();
        if (subtitleKey == null || subtitleKey.isBlank()) {
            throw new ResourceNotFoundException("Subtitle not found for this lesson");
        }

        byte[] raw = storageService.getBytes(subtitleKey);
        return lessonUtil.convertToVtt(raw, subtitleKey).getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public Page<LessonResponseDto> getLessons(UUID sectionId, Pageable pageable) {
        if (sectionId != null) {
            return lessonRepository.findBySection_Id(sectionId, pageable).map(lessonMapper::toResponse);
        }
        return lessonRepository.findAll(pageable).map(lessonMapper::toResponse);
    }

    @Override
    public LessonResponseDto getLessonById(UUID id) {
        return lessonMapper.toResponse(lessonUtil.findLessonOrThrow(id));
    }

    @Override
    @Transactional
    public LessonResponseDto createLesson(CreateLessonRequestDto createLessonRequestDto) {
        Section section = sectionRepository.findById(createLessonRequestDto.sectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));

        lessonUtil.requireNonEmptyFile(createLessonRequestDto.video(), "Video");

        int sortOrder = lessonRepository.findMaxSortOrderBySectionId(section.getId()) + 1;

        Lesson lesson = new Lesson();
        lesson.setTitle(createLessonRequestDto.title());
        lesson.setSection(section);
        lesson.setDescription(createLessonRequestDto.description());
        lesson.setDurationSeconds(createLessonRequestDto.durationSeconds());
        lesson.setSortOrder(sortOrder);
        lesson.setIsPreview(Boolean.TRUE.equals(createLessonRequestDto.isPreview()));
        lesson.setVideoStatus(VideoStatus.PROCESSING);
        Lesson savedLesson = lessonRepository.save(lesson);

        String prefix = lessonUtil.formatLessonAssetPrefix(
                section.getCourse().getTitle(),
                section.getTitle(),
                savedLesson.getId());
        String videoKey = lessonUtil.sourceVideoKey(prefix);
        String playlistKey = lessonUtil.hlsPlaylistKey(prefix);

        try {
            StorageUploadResult videoUpload = storageService.uploadToKey(createLessonRequestDto.video(), videoKey);
            savedLesson.setVideoStorageKey(videoUpload.key());
        } catch (Exception ex) {
            storageService.deletePrefix(prefix);
            throw new StorageException("Failed to upload lesson video", ex);
        }

        Lesson persisted = lessonRepository.save(savedLesson);
        lessonUtil.enqueueTranscodeAfterCommit(persisted.getId(), videoKey, prefix + "/hls", playlistKey);
        lessonUtil.publishStatusAfterCommit(persisted);
        return lessonMapper.toResponse(persisted);
    }

    @Override
    @Transactional
    public LessonResponseDto updateLesson(UUID lessonId, UpdateLessonRequestDto updateLessonRequestDto) {
        Lesson lesson = lessonUtil.findLessonOrThrow(lessonId);

        if (updateLessonRequestDto.title() != null && !updateLessonRequestDto.title().isEmpty()) {
            lesson.setTitle(updateLessonRequestDto.title());
        }

        if (updateLessonRequestDto.description() != null && !updateLessonRequestDto.description().isEmpty()) {
            lesson.setDescription(updateLessonRequestDto.description());
        }

        if (updateLessonRequestDto.isPreview() != null) {
            lesson.setIsPreview(updateLessonRequestDto.isPreview());
        }

        boolean shouldTranscode = false;
        String enqueuePrefix = null;
        String enqueueVideoKey = null;
        String enqueuePlaylistKey = null;

        if (lessonUtil.hasFile(updateLessonRequestDto.video())) {
            lessonUtil.requireNonEmptyFile(updateLessonRequestDto.video(), "Video");
            final String prefix = lessonUtil.resolveLessonPrefix(lesson);
            final String videoKey = lessonUtil.sourceVideoKey(prefix);
            final String playlistKey = lessonUtil.hlsPlaylistKey(prefix);
            final String hlsPrefix = prefix + "/hls";

            try {
                storageService.deletePrefix(hlsPrefix);
                StorageUploadResult videoUpload =
                        storageService.uploadToKey(updateLessonRequestDto.video(), videoKey);
                lesson.setVideoStorageKey(videoUpload.key());
                lesson.setHlsPlaylistKey(null);
                lesson.setVideoStatus(VideoStatus.PROCESSING);
                shouldTranscode = true;
                enqueuePrefix = prefix;
                enqueueVideoKey = videoKey;
                enqueuePlaylistKey = playlistKey;
            } catch (Exception ex) {
                throw new StorageException("Failed to upload lesson video", ex);
            }
        }

        if (updateLessonRequestDto.durationSeconds() != null) {
            lesson.setDurationSeconds(updateLessonRequestDto.durationSeconds());
        }

        Lesson saved = lessonRepository.save(lesson);
        if (shouldTranscode) {
            lessonUtil.enqueueTranscodeAfterCommit(
                    saved.getId(), enqueueVideoKey, enqueuePrefix + "/hls", enqueuePlaylistKey);
            lessonUtil.publishStatusAfterCommit(saved);
        }
        return lessonMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public LessonResponseDto uploadSubtitle(UUID lessonId, UploadSubtitleRequestDto uploadSubtitleRequestDto) {
        Lesson lesson = lessonUtil.findLessonOrThrow(lessonId);

        lessonUtil.requireNonEmptyFile(uploadSubtitleRequestDto.subtitle(), "Subtitle");

        String prefix = lessonUtil.resolveLessonPrefix(lesson);
        String subtitleKey = lessonUtil.subtitleKey(prefix);

        try {
            byte[] raw = uploadSubtitleRequestDto.subtitle().getBytes();
            String vtt = lessonUtil.convertToVtt(raw, lessonUtil.optionalFilename(uploadSubtitleRequestDto.subtitle()));
            storageService.uploadBytes(subtitleKey, vtt.getBytes(StandardCharsets.UTF_8), "text/vtt");
            lesson.setSubtitleStorageKey(subtitleKey);
        } catch (Exception ex) {
            throw new StorageException("Failed to upload lesson subtitle", ex);
        }

        return lessonMapper.toResponse(lessonRepository.save(lesson));
    }

    @Override
    @Transactional
    public LessonResponseDto requeueTranscode(UUID lessonId) {
        Lesson lesson = lessonUtil.findLessonOrThrow(lessonId);
        if (lesson.getVideoStorageKey() == null || lesson.getVideoStorageKey().isBlank()) {
            throw new IllegalArgumentException("Lesson has no source video to transcode");
        }

        String prefix = lessonUtil.resolveLessonPrefix(lesson);
        String videoKey = lesson.getVideoStorageKey();
        String playlistKey = lessonUtil.hlsPlaylistKey(prefix);

        lesson.setVideoStatus(VideoStatus.PROCESSING);
        lesson.setHlsPlaylistKey(null);
        Lesson saved = lessonRepository.save(lesson);
        lessonUtil.enqueueTranscodeAfterCommit(saved.getId(), videoKey, prefix + "/hls", playlistKey);
        lessonUtil.publishStatusAfterCommit(saved);
        return lessonMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteLesson(UUID lessonId) {
        Lesson lesson = lessonUtil.findLessonOrThrow(lessonId);
        lesson.softDelete();
        lessonRepository.save(lesson);

        String prefix = lessonUtil.resolveLessonPrefix(lesson);
        storageService.deletePrefix(prefix);
    }

    @Override
    public HlsAsset getHlsAsset(UUID lessonId, String filename) {
        Lesson lesson = lessonUtil.requireWatchableLesson(lessonId);

        if (lesson.getVideoStatus() != VideoStatus.READY
                || lesson.getHlsPlaylistKey() == null
                || lesson.getHlsPlaylistKey().isBlank()) {
            throw new ResourceNotFoundException("HLS playlist not ready for this lesson");
        }

        String safeName = lessonUtil.requireSafeHlsFilename(filename);
        String hlsDir = lessonUtil.stripMasterFilename(lesson.getHlsPlaylistKey());
        String key = hlsDir + safeName;

        byte[] content;
        try {
            content = storageService.getBytes(key);
        } catch (StorageException ex) {
            throw new ResourceNotFoundException("HLS asset not found: " + safeName);
        }
        return new HlsAsset(content, lessonUtil.contentTypeFor(safeName));
    }

    @Override
    @Transactional
    public void reorderLessons(UUID sectionId, ReorderLessonsRequestDto reorderLessonsRequestDto) {
        List<UUID> orderedIds = reorderLessonsRequestDto.lessonIds();
        Set<UUID> uniqueIds = new HashSet<>(orderedIds);
        if (uniqueIds.size() != orderedIds.size()) {
            throw new IllegalArgumentException("Lesson IDs must be unique");
        }

        List<Lesson> lessons = lessonRepository.findBySection_Id(sectionId);
        if (lessons.size() != orderedIds.size()) {
            throw new IllegalArgumentException("Lesson IDs do not match section lessons");
        }

        Map<UUID, Lesson> byId = lessons.stream()
                .collect(Collectors.toMap(Lesson::getId, Function.identity()));
        if (!byId.keySet().containsAll(orderedIds)) {
            throw new IllegalArgumentException("One or more lesson IDs do not belong to this section");
        }

        for (int i = 0; i < orderedIds.size(); i++) {
            byId.get(orderedIds.get(i)).setSortOrder(-(i + 1));
        }
        lessonRepository.saveAllAndFlush(lessons);

        for (int i = 0; i < orderedIds.size(); i++) {
            byId.get(orderedIds.get(i)).setSortOrder(i + 1);
        }
        lessonRepository.saveAll(lessons);
    }
}
