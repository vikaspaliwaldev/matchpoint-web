package io.matchpoint.controller;

import io.matchpoint.entity.MatchHistory;
import io.matchpoint.repository.MatchHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/match-history")
@RequiredArgsConstructor
public class MatchHistoryController {

    private final MatchHistoryRepository matchHistoryRepository;

    @GetMapping
    public List<MatchHistory> getAllMatchHistory() {
        return matchHistoryRepository.findAll();
    }

    @GetMapping("/match/{matchId}")
    public ResponseEntity<MatchHistory> getByMatchId(@PathVariable String matchId) {
        return matchHistoryRepository.findByMatchId(matchId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tournament/{tournamentId}")
    public List<MatchHistory> getByTournament(@PathVariable String tournamentId) {
        return matchHistoryRepository.findByTournamentIdOrderByCreatedAtDesc(tournamentId);
    }

    @GetMapping("/event/{eventId}")
    public List<MatchHistory> getByEvent(@PathVariable String eventId) {
        return matchHistoryRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    @PostMapping
    public ResponseEntity<MatchHistory> createMatchHistory(@RequestBody MatchHistory history) {
        // Upsert: if a record already exists for this match, update it
        matchHistoryRepository.findByMatchId(history.getMatchId()).ifPresent(existing -> {
            matchHistoryRepository.delete(existing);
        });
        MatchHistory saved = matchHistoryRepository.save(history);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
