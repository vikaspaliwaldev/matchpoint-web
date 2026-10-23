package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    private String phone;

    // Maps PostgreSQL TEXT[] natively in Hibernate 6
    @Column(name = "roles", columnDefinition = "text[]")
    private String[] roles;

    @Column(columnDefinition = "TEXT")
    private String avatar;

    private Integer age;

    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
