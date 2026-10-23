package vhuwng.itisacademy.Section;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vhuwng.itisacademy.Section.entity.Section;

public interface SectionRepository extends JpaRepository<Section, UUID> {

    Page<Section> findByCourse_Id(UUID courseId, Pageable pageable);

    boolean existsByCourse_IdAndSortOrder(UUID courseId, Integer sortOrder);

    boolean existsByCourse_IdAndSortOrderAndIdNot(UUID courseId, Integer sortOrder, UUID id);

    /** Max sort_order among non-deleted sections (@SQLRestriction). */
    @Query("select coalesce(max(s.sortOrder), 0) from Section s where s.course.id = :courseId")
    int findMaxSortOrderByCourseId(@Param("courseId") UUID courseId);

    List<Section> findByCourse_Id(UUID courseId);
}
