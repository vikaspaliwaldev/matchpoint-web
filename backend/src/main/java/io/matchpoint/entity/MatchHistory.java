package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "match_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchHistory {

    @Id
    private String id;

    @Column(name = "match_id", nullable = false)
    private String matchId;

    @Column(name = "tournament_id")
    private String tournamentId;

    @Column(name = "event_id")
    private String eventId;

    @Column(name = "umpire_id")
    private String umpireId;

    @Column(name = "umpire_name")
    private String umpireName;

    @Column(name = "player1_name")
    private String player1Name;

    @Column(name = "player2_name")
    private String player2Name;

    @Column(name = "scoring_format")
    private String scoringFormat;

    @Column(name = "best_of_games")
    private Integer bestOfGames;

    private String court;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "points_history", columnDefinition = "jsonb")
    private List<Map<String, Object>> pointsHistory;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sets_snapshot", columnDefinition = "jsonb")
    private List<Match.MatchSet> setsSnapshot;

    @Column(name = "total_duration_seconds")
    private Integer totalDurationSeconds;

    @Column(name = "play_time_seconds")
    private Integer playTimeSeconds;

    @Column(name = "paused_time_seconds")
    private Integer pausedTimeSeconds;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "winner_id")
    private String winnerId;

    @Column(name = "winner_name")
    private String winnerName;

    @Column(name = "final_status")
    private String finalStatus;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
