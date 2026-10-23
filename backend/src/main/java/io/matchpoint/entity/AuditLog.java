package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    private String id;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String category; // 'tournament', 'event', 'registration', 'match', 'team', 'auth'

    @Column(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonAlias({"userId", "user_id"})
    private String userId;

    @Column(name = "user_name", nullable = false)
    @com.fasterxml.jackson.annotation.JsonAlias({"userName", "user_name"})
    private String userName;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
