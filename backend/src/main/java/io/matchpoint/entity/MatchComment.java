package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "match_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchComment {

    @Id
    private String id;

    @Column(name = "match_id", nullable = false)
    private String matchId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
