package io.matchpoint.controller;

import io.matchpoint.entity.Match;
import io.matchpoint.entity.Profile;
import io.matchpoint.repository.MatchRepository;
import io.matchpoint.repository.ProfileRepository;
import io.matchpoint.dto.LeaderboardRow;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final ProfileRepository profileRepository;
    private final MatchRepository matchRepository;

    @GetMapping
    public List<LeaderboardRow> getLeaderboard() {
        List<Profile> profiles = profileRepository.findAll();
        List<Match> matches = matchRepository.findAll().stream()
                .filter(m -> "completed".equals(m.getStatus()))
                .filter(m -> m.getIsAdhoc() == null || !m.getIsAdhoc())
                .collect(Collectors.toList());

        // Group matches by eventId to identify champions (winner of max fixtureRound in each event)
        Map<String, List<Match>> matchesByEvent = matches.stream()
                .collect(Collectors.groupingBy(Match::getEventId));

        Set<String> champions = new HashSet<>();
        for (Map.Entry<String, List<Match>> entry : matchesByEvent.entrySet()) {
            List<Match> eventMatches = entry.getValue();
            if (!eventMatches.isEmpty()) {
                // The final is the match with the highest fixtureRound
                Match finalMatch = eventMatches.stream()
                        .max(Comparator.comparingInt(Match::getFixtureRound))
                        .orElse(null);
                if (finalMatch != null && finalMatch.getWinnerId() != null) {
                    champions.add(finalMatch.getWinnerId());
                }
            }
        }

        // Generate leaderboard row details for all users
        List<LeaderboardRow> rows = new ArrayList<>();
        for (Profile p : profiles) {
            int played = 0;
            int wins = 0;
            int losses = 0;

            for (Match m : matches) {
                boolean isP1 = p.getId().equals(m.getPlayer1Id());
                boolean isP2 = p.getId().equals(m.getPlayer2Id());
                if (isP1 || isP2) {
                    played++;
                    if (p.getId().equals(m.getWinnerId())) {
                        wins++;
                    } else if (m.getWinnerId() != null) {
                        losses++;
                    }
                }
            }

            int championshipsCount = champions.contains(p.getId()) ? 1 : 0;
            int points = (wins * 10) + (losses * 2) + (championshipsCount * 20);
            double winRate = played > 0 ? Math.round(((double) wins / played) * 1000.0) / 10.0 : 0.0;

            rows.add(LeaderboardRow.builder()
                    .playerId(p.getId())
                    .playerName(p.getName())
                    .playerEmail(p.getEmail())
                    .played(played)
                    .wins(wins)
                    .losses(losses)
                    .winRate(winRate)
                    .championships(championshipsCount)
                    .points(points)
                    .build());
        }

        // Rank players by points desc, then winRate desc, then matches volume desc
        rows.sort((r1, r2) -> {
            if (r2.getPoints() != r1.getPoints()) {
                return Integer.compare(r2.getPoints(), r1.getPoints());
            }
            if (r2.getWinRate() != r1.getWinRate()) {
                return Double.compare(r2.getWinRate(), r1.getWinRate());
            }
            return Integer.compare(r2.getPlayed(), r1.getPlayed());
        });

        return rows;
    }
}
