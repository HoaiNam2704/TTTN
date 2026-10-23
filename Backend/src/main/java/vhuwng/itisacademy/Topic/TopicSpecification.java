package vhuwng.itisacademy.Topic;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import vhuwng.itisacademy.Topic.dto.TopicFilter;
import vhuwng.itisacademy.Topic.entity.Topic;

public final class TopicSpecification {

    private TopicSpecification() {
    }

    public static Specification<Topic> filter(TopicFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.search() != null && !filter.search().isBlank()) {
                String pattern = "%" + filter.search().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
