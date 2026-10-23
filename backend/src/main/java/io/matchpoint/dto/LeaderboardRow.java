package io.matchpoint.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardRow {
    private String playerId;
    private String playerName;
    private String playerEmail;
    private int played;
    private int wins;
    private int losses;
    private double winRate;
    private int championships;
    private int points;
}
