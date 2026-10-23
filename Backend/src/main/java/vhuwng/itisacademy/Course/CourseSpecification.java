package vhuwng.itisacademy.Course;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import vhuwng.itisacademy.Course.dto.CourseFilter;
import vhuwng.itisacademy.Course.entity.Course;
import vhuwng.itisacademy.Enrollment.entity.Enrollment;

public final class CourseSpecification {

    private CourseSpecification() {
    }

    public static Specification<Course> filter(CourseFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.title() != null && !filter.title().isBlank()) {
                String pattern = "%" + filter.title().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern)
                ));
            }
            if (filter.categoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), filter.categoryId()));
            }
            if (filter.status() != null) {
                predicates.add(cb.equal(root.get("status"), filter.status()));
            }
            if (filter.level() != null) {
                predicates.add(cb.equal(root.get("level"), filter.level()));
            }
            if (filter.minRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("averageRating"), filter.minRating()));
            }
            if (filter.maxRating() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("averageRating"), filter.maxRating()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Course> enrolledByUser(UUID userId) {
        return (root, query, cb) -> {
            Subquery<UUID> subquery = query.subquery(UUID.class);
            Root<Enrollment> enrollment = subquery.from(Enrollment.class);
            subquery.select(enrollment.get("course").get("id"))
                    .where(
                            cb.equal(enrollment.get("user").get("id"), userId),
                            cb.isNull(enrollment.get("deletedAt"))
                    );
            return root.get("id").in(subquery);
        };
    }
}
