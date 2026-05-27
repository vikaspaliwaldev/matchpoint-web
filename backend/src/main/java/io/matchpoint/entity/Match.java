package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match {

    @Id
    private String id;

    @Column(name = "tournament_id", nullable = false)
    private String tournamentId;

    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Column(name = "fixture_round", nullable = false)
    private Integer fixtureRound;

    @Column(name = "fixture_position", nullable = false)
    private Integer fixturePosition;

    private String court;

    @Column(name = "player1_id", nullable = false)
    private String player1Id;

    @Column(name = "player1_name", nullable = false)
    private String player1Name;

    @Column(name = "player2_id", nullable = false)
    private String player2Id;

    @Column(name = "player2_name", nullable = false)
    private String player2Name;

    @Column(name = "umpire_id")
    private String umpireId;

    @Column(name = "umpire_name")
    private String umpireName;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(nullable = false)
    private String status; // 'scheduled', 'running', 'paused', 'completed'

    @Column(name = "winner_id")
    private String winnerId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sets", columnDefinition = "jsonb")
    private List<MatchSet> sets;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sub_matches", columnDefinition = "jsonb")
    private List<TeamSubMatch> subMatches;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchSet {
        private int set_number;
        private int player1_score;
        private int player2_score;
        private boolean is_complete;
        private String winner_id;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamSubMatch {
        private String id;
        private String event_type;
        private List<String> player1_names;
        private List<String> player2_names;
        private List<MatchSet> sets;
        private String status;
        private String winner_id;
    }
}
