package io.matchpoint.controller;

import io.matchpoint.entity.Match;
import io.matchpoint.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Arrays;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

@RestController
@RequestMapping("/api/v1/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchRepository matchRepository;
    private final io.matchpoint.repository.ProfileRepository profileRepository;

    @GetMapping
    @Cacheable(value = "matches", key = "#status ?: 'all'")
    public List<Match> getAllMatches(@RequestParam(value = "status", required = false) String status) {
        if (status != null && !status.isBlank()) {
            List<String> statuses = Arrays.asList(status.split(","));
            return matchRepository.findByStatusIn(statuses);
        }
        return matchRepository.findAll();
    }

    @GetMapping("/live")
    @Cacheable(value = "matches", key = "'live'")
    public List<Match> getLiveMatches() {
        return matchRepository.findByStatusIn(Arrays.asList("running", "paused"));
    }

    @GetMapping("/event/{eventId}")
    @Cacheable(value = "matches", key = "'event-' + #eventId")
    public List<Match> getMatchesByEvent(@PathVariable String eventId) {
        return matchRepository.findByEventId(eventId);
    }

    @GetMapping("/tournament/{tournamentId}")
    @Cacheable(value = "matches", key = "'tour-' + #tournamentId")
    public List<Match> getMatchesByTournament(@PathVariable String tournamentId) {
        return matchRepository.findByTournamentId(tournamentId);
    }

    @GetMapping("/{id}")
    @Cacheable(value = "matches", key = "#id")
    public ResponseEntity<Match> getMatchById(@PathVariable String id) {
        return matchRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @CacheEvict(value = "matches", allEntries = true)
    public ResponseEntity<Match> createMatch(@RequestBody Match match) {
        if (match.getPlayer1Id() != null && match.getPlayer2Id() != null 
            && !match.getPlayer1Id().equalsIgnoreCase("tbd") 
            && !match.getPlayer1Id().equalsIgnoreCase("bye") 
            && match.getPlayer1Id().equals(match.getPlayer2Id())) {
            return ResponseEntity.badRequest().build();
        }
        if (match.getSets() == null) {
            match.setSets(new java.util.ArrayList<>());
        }
        if (match.getUmpireId() != null && !profileRepository.existsById(match.getUmpireId())) {
            match.setUmpireId(null);
        }
        Match saved = matchRepository.save(match);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @CacheEvict(value = "matches", allEntries = true)
    public ResponseEntity<Match> updateMatch(@PathVariable String id, @RequestBody Match match) {
        if (!matchRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        if (match.getPlayer1Id() != null && match.getPlayer2Id() != null 
            && !match.getPlayer1Id().equalsIgnoreCase("tbd") 
            && !match.getPlayer1Id().equalsIgnoreCase("bye") 
            && match.getPlayer1Id().equals(match.getPlayer2Id())) {
            return ResponseEntity.badRequest().build();
        }
        if (match.getSets() == null) {
            match.setSets(new java.util.ArrayList<>());
        }
        if (match.getUmpireId() != null && !profileRepository.existsById(match.getUmpireId())) {
            match.setUmpireId(null);
        }
        match.setId(id);
        Match updated = matchRepository.save(match);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @CacheEvict(value = "matches", allEntries = true)
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
    @CacheEvict(value = "matches", allEntries = true)
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

    @PostMapping("/viewers")
    @Transactional
    public ResponseEntity<Void> updateLiveViewers(@RequestParam("count") int count) {
        matchRepository.updateRunningMatchesMaxViewers(count);
        return ResponseEntity.ok().build();
    }
}
