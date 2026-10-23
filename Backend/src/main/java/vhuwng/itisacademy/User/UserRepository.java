package vhuwng.itisacademy.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import vhuwng.itisacademy.User.entity.User;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByStudentId(String studentId);

    @Query("""
            SELECT DISTINCT u.studentClass
            FROM User u
            WHERE u.studentClass IS NOT NULL AND TRIM(u.studentClass) <> ''
            ORDER BY u.studentClass
            """)
    List<String> findDistinctStudentClasses();

    @Query("""
            SELECT DISTINCT u.studentMajor
            FROM User u
            WHERE u.studentMajor IS NOT NULL AND TRIM(u.studentMajor) <> ''
            ORDER BY u.studentMajor
            """)
    List<String> findDistinctStudentMajors();
}
