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

    @Column(name = "tournament_id")
    private String tournamentId;

    @Column(name = "event_id")
    private String eventId;

    @Column(name = "fixture_round")
    private Integer fixtureRound;

    @Column(name = "round_name")
    private String roundName;

    @Column(name = "fixture_position")
    private Integer fixturePosition;

    @Column(name = "is_adhoc")
    @com.fasterxml.jackson.annotation.JsonProperty("is_adhoc")
    private Boolean isAdhoc;

    @Column(name = "adhoc_type")
    @com.fasterxml.jackson.annotation.JsonProperty("adhoc_type")
    private String adhocType;

    private String court;
    
    @Column(name = "max_viewers")
    @com.fasterxml.jackson.annotation.JsonProperty("max_viewers")
    private Integer maxViewers;

    @Column(name = "player1_id")
    private String player1Id;

    @Column(name = "player1_name", nullable = false)
    private String player1Name;

    @Column(name = "player2_id")
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

    @Column(name = "sport")
    private String sport = "badminton";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sport_metadata", columnDefinition = "jsonb")
    @com.fasterxml.jackson.annotation.JsonProperty("sport_metadata")
    private java.util.Map<String, Object> sportMetadata;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sets", columnDefinition = "jsonb")
    private List<MatchSet> sets;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sub_matches", columnDefinition = "jsonb")
    private List<TeamSubMatch> subMatches;

    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class MatchSet {
        @com.fasterxml.jackson.annotation.JsonProperty("set_number")
        private int setNumber;

        @com.fasterxml.jackson.annotation.JsonProperty("player1_score")
        private int player1Score;

        @com.fasterxml.jackson.annotation.JsonProperty("player2_score")
        private int player2Score;

        @com.fasterxml.jackson.annotation.JsonProperty("is_complete")
        private boolean isComplete;

        @com.fasterxml.jackson.annotation.JsonProperty("winner_id")
        private String winnerId;

        @com.fasterxml.jackson.annotation.JsonProperty("set_number")
        public int getSetNumber() { return setNumber; }
        @com.fasterxml.jackson.annotation.JsonProperty("set_number")
        public void setSetNumber(int setNumber) { this.setNumber = setNumber; }

        @com.fasterxml.jackson.annotation.JsonProperty("player1_score")
        public int getPlayer1Score() { return player1Score; }
        @com.fasterxml.jackson.annotation.JsonProperty("player1_score")
        public void setPlayer1Score(int player1Score) { this.player1Score = player1Score; }

        @com.fasterxml.jackson.annotation.JsonProperty("player2_score")
        public int getPlayer2Score() { return player2Score; }
        @com.fasterxml.jackson.annotation.JsonProperty("player2_score")
        public void setPlayer2Score(int player2Score) { this.player2Score = player2Score; }

        @com.fasterxml.jackson.annotation.JsonProperty("is_complete")
        public boolean isComplete() { return isComplete; }
        @com.fasterxml.jackson.annotation.JsonProperty("is_complete")
        public void setComplete(boolean isComplete) { this.isComplete = isComplete; }

        @com.fasterxml.jackson.annotation.JsonProperty("winner_id")
        public String getWinnerId() { return winnerId; }
        @com.fasterxml.jackson.annotation.JsonProperty("winner_id")
        public void setWinnerId(String winnerId) { this.winnerId = winnerId; }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class TeamSubMatch {
        private String id;

        @com.fasterxml.jackson.annotation.JsonProperty("event_type")
        private String eventType;

        @com.fasterxml.jackson.annotation.JsonProperty("player1_names")
        private List<String> player1Names;

        @com.fasterxml.jackson.annotation.JsonProperty("player2_names")
        private List<String> player2Names;

        private List<MatchSet> sets;
        private String status;

        @com.fasterxml.jackson.annotation.JsonProperty("winner_id")
        private String winnerId;
    }
}
