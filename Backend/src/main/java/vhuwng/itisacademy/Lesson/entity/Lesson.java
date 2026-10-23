package vhuwng.itisacademy.Lesson.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLRestriction;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vhuwng.itisacademy.Section.entity.Section;
import vhuwng.itisacademy.common.entity.BaseEntity;
import vhuwng.itisacademy.common.enums.VideoStatus;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "lessons", indexes = {
        @Index(name = "idx_lessons_section_id", columnList = "section_id"),
        @Index(name = "idx_lessons_section_sort_order", columnList = "section_id, sort_order")
})
@Getter
@Setter
@NoArgsConstructor
public class Lesson extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "video_storage_key", length = 500)
    private String videoStorageKey;

    @Column(name = "subtitle_storage_key", length = 500)
    private String subtitleStorageKey;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "is_preview", nullable = false)
    private Boolean isPreview = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "video_status", nullable = false)
    private VideoStatus videoStatus = VideoStatus.PROCESSING;

    @Column(name = "hls_playlist_key", length = 500)
    private String hlsPlaylistKey;
}
