package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentEvent {

    @Id
    private String id;

    @Column(name = "tournament_id", nullable = false)
    private String tournamentId;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Column(nullable = false)
    private String category;

    @Column(name = "entry_limit", nullable = false)
    private Integer entryLimit;

    @Column(nullable = false)
    private String format; // 'knockout', 'round_robin', 'swiss', 'league', 'hybrid'

    @Column(name = "scoring_format", nullable = false)
    private String scoringFormat; // '11-point', '15-point', '21-point'

    @Column(name = "registrations_count")
    private Integer registrationsCount;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
