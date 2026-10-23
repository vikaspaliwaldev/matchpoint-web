package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tournament_feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tournament_id", nullable = false)
    private String tournamentId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "feedback_type", nullable = false)
    private String feedbackType; // 'Bug', 'Suggestion', 'Rule Dispute', 'General'

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
