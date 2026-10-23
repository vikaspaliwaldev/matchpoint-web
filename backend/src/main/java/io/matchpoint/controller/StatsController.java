package io.matchpoint.controller;

import io.matchpoint.repository.MatchRepository;
import io.matchpoint.repository.ProfileRepository;
import io.matchpoint.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
public class StatsController {

    private final MatchRepository matchRepository;
    private final ProfileRepository profileRepository;
    private final TournamentRepository tournamentRepository;

    /**
     * Returns lightweight aggregate counts for the landing page.
     * Uses COUNT(*) queries instead of loading full entity graphs.
     */
    @GetMapping
    public Map<String, Long> getStats() {
        long tournaments = tournamentRepository.count();
        long players = profileRepository.countByRolesContaining("player");
        long matches = matchRepository.count();
        return Map.of(
                "tournaments", tournaments,
                "players", players,
                "matches", matches
        );
    }
}
