package vhuwng.itisacademy.User;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import vhuwng.itisacademy.User.dto.UserFilter;
import vhuwng.itisacademy.User.entity.User;

public class UserSpecification {
    public static Specification<User> filter(UserFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.search() != null && !filter.search().isBlank()) {
                String pattern = "%" + filter.search().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("username")), pattern),
                        cb.like(cb.lower(root.get("firstName")), pattern),
                        cb.like(cb.lower(root.get("lastName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("phoneNumber")), pattern)));
            }
            if (filter.role() != null) {
                predicates.add(cb.equal(root.get("role"), filter.role()));
            }
            if (filter.studentClass() != null && !filter.studentClass().isBlank()) {
                predicates.add(cb.equal(root.get("studentClass"), filter.studentClass().trim()));
            }
            if (filter.studentMajor() != null && !filter.studentMajor().isBlank()) {
                predicates.add(cb.equal(root.get("studentMajor"), filter.studentMajor().trim()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
