package vhuwng.itisacademy.Course;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;
import vhuwng.itisacademy.Course.entity.Course;
import vhuwng.itisacademy.Lesson.entity.Lesson;
import vhuwng.itisacademy.Section.entity.Section;
import vhuwng.itisacademy.common.enums.CourseStatus;

public interface CourseRepository extends JpaRepository<Course, UUID>, JpaSpecificationExecutor<Course> {

    Optional<Course> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    @Query("""
            SELECT COUNT(c)
            FROM Course c
            WHERE c.category.id = :categoryId
              AND c.status = :status
            """)
    long countByCategoryIdAndStatus(
            @Param("categoryId") UUID categoryId,
            @Param("status") CourseStatus status);

    @Query("""
            SELECT c.category.id, COUNT(c)
            FROM Course c
            WHERE c.category.id IN :categoryIds
              AND c.status = :status
            GROUP BY c.category.id
            """)
    List<Object[]> countGroupedByCategoryIdsAndStatus(
            @Param("categoryIds") Collection<UUID> categoryIds,
            @Param("status") CourseStatus status);

    @Query("""
    select s
    from Course c
    join Section s on s.course = c
    where c.id = :id
    order by s.sortOrder
    """)
    List<Section> findSectionByCourseId(@Param("id") UUID id);

    @Query("""
    select l
    from Course c
    join Section s on s.course = c
    join Lesson l on l.section = s
    where c.id = :id
    order by s.sortOrder, l.sortOrder
    """)
    List<Lesson> findLessonByCourseId(@Param("id") UUID id);

}
