package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonAlias({"userId", "user_id"})
    private String userId;

    @Column(name = "user_name")
    @com.fasterxml.jackson.annotation.JsonAlias({"userName", "user_name"})
    private String userName;

    @Column(name = "activity_type", nullable = false)
    @com.fasterxml.jackson.annotation.JsonAlias({"activityType", "activity_type"})
    private String activityType; // 'PAGE_VIEW', 'CREATE_TOURNAMENT', etc.

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
