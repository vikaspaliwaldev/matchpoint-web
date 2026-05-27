package io.matchpoint.controller;

import io.matchpoint.entity.Match;
import io.matchpoint.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@RestController
@RequestMapping("/api/v1/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchRepository matchRepository;

    @GetMapping
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    @GetMapping("/event/{eventId}")
    public List<Match> getMatchesByEvent(@PathVariable String eventId) {
        return matchRepository.findByEventId(eventId);
    }

    @GetMapping("/tournament/{tournamentId}")
    public List<Match> getMatchesByTournament(@PathVariable String tournamentId) {
        return matchRepository.findByTournamentId(tournamentId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Match> getMatchById(@PathVariable String id) {
        return matchRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Match> createMatch(@RequestBody Match match) {
        Match saved = matchRepository.save(match);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Match> updateMatch(@PathVariable String id, @RequestBody Match match) {
        if (!matchRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        match.setId(id);
        Match updated = matchRepository.save(match);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMatch(@PathVariable String id) {
        if (!matchRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        matchRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/umpire/{umpireId}")
    public List<Match> getMatchesByUmpire(@PathVariable String umpireId) {
        return matchRepository.findByUmpireId(umpireId);
    }

    @GetMapping("/player/{playerId}")
    public List<Match> getMatchesByPlayer(@PathVariable String playerId) {
        return matchRepository.findByPlayer1IdOrPlayer2Id(playerId, playerId);
    }

    @PostMapping("/batch")
    @Transactional
    public ResponseEntity<List<Match>> saveMatchesBatch(@RequestBody List<Match> matches) {
        if (matches == null || matches.isEmpty()) {
            return ResponseEntity.ok(matches);
        }
        String eventId = matches.get(0).getEventId();
        // Delete existing matches for this event to avoid duplication
        List<Match> existing = matchRepository.findByEventId(eventId);
        matchRepository.deleteAll(existing);
        // Save new matches
        List<Match> saved = matchRepository.saveAll(matches);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
