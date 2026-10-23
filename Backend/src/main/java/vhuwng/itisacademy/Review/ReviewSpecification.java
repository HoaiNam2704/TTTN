package vhuwng.itisacademy.Review;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import vhuwng.itisacademy.Review.dto.ReviewFilter;
import vhuwng.itisacademy.Review.entity.Review;

public final class ReviewSpecification {

    private ReviewSpecification() {
    }

    public static Specification<Review> filter(ReviewFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.courseId() != null) {
                predicates.add(cb.equal(root.get("course").get("id"), filter.courseId()));
            }
            if (filter.rating() != null) {
                predicates.add(cb.equal(root.get("rating"), filter.rating()));
            }
            if (filter.fromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.fromDate()));
            }
            if (filter.toDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.toDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
