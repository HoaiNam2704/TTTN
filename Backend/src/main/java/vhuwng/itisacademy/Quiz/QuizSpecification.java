package vhuwng.itisacademy.Quiz;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import vhuwng.itisacademy.Quiz.dto.QuizFilter;
import vhuwng.itisacademy.Quiz.entity.Quiz;

public final class QuizSpecification {

    private QuizSpecification() {
    }

    public static Specification<Quiz> filter(QuizFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.search() != null && !filter.search().isBlank()) {
                String pattern = "%" + filter.search().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)));
            }
            if (filter.topicId() != null) {
                predicates.add(cb.equal(root.get("topic").get("id"), filter.topicId()));
            }
            if (filter.isPublished() != null) {
                predicates.add(cb.equal(root.get("published"), filter.isPublished()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
