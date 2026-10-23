package vhuwng.itisacademy.Lesson;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vhuwng.itisacademy.Lesson.entity.Lesson;

public interface LessonRepository extends JpaRepository<Lesson, UUID>, JpaSpecificationExecutor<Lesson> {
    Page<Lesson> findByTitle(String title, Pageable pageable);

    Page<Lesson> findBySection_Id(UUID sectionId, Pageable pageable);

    long countBySection_Course_Id(UUID courseId);

    /** Max sort_order among non-deleted lessons (@SQLRestriction). */
    @Query("select coalesce(max(l.sortOrder), 0) from Lesson l where l.section.id = :sectionId")
    int findMaxSortOrderBySectionId(@Param("sectionId") UUID sectionId);

    List<Lesson> findBySection_Id(UUID sectionId);
}
