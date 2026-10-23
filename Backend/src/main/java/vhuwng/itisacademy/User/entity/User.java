package vhuwng.itisacademy.User.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLRestriction;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vhuwng.itisacademy.common.entity.BaseEntity;
import vhuwng.itisacademy.common.enums.Role;

@Entity
@SQLRestriction("deleted_at IS NULL")
@Table(name = "users", indexes = {
        @Index(name = "idx_users_username", columnList = "username"),
        @Index(name = "idx_users_email", columnList = "email"),
        @Index(name = "idx_users_role", columnList = "role"),
        @Index(name = "idx_users_student_id", columnList = "student_id"),
        @Index(name = "idx_users_student_class", columnList = "student_class"),
        @Index(name = "idx_users_student_major", columnList = "student_major"),
        @Index(name = "idx_users_student_id_class_major", columnList = "student_id, student_class, student_major")
})
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String email;
    @Column(nullable = false, length = 255)
    private String phoneNumber;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(name = "first_name", length = 100, nullable = false)
    private String firstName;

    @Column(name = "last_name", length = 100, nullable = false)
    private String lastName;

    @Column(name = "dob")
    private LocalDate dob;

    @Column(name = "student_id", length = 20, unique = true, nullable = false)
    private String studentId;

    @Column(name = "student_class", length = 50)
    private String studentClass;

    @Column(name = "student_major", length = 100)
    private String studentMajor;
}
