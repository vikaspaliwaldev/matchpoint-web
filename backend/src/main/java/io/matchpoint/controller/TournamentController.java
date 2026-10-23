package io.matchpoint.controller;

import io.matchpoint.dto.TournamentSummaryDto;
import io.matchpoint.entity.Tournament;
import io.matchpoint.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

@RestController
@RequestMapping("/api/v1/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentRepository tournamentRepository;

    @GetMapping
    @Cacheable(value = "tournaments", key = "'all'")
    public List<TournamentSummaryDto> getAllTournaments() {
        return tournamentRepository.findAllSummaries();
    }

    @GetMapping("/{id}")
    @Cacheable(value = "tournaments", key = "#id")
    public ResponseEntity<Tournament> getTournamentById(@PathVariable String id) {
        return tournamentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @CacheEvict(value = "tournaments", allEntries = true)
    public ResponseEntity<?> createTournament(@RequestBody Tournament tournament) {
        if (tournamentRepository.existsByName(tournament.getName())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("A tournament with the name '" + tournament.getName() + "' already exists.");
        }
        Tournament saved = tournamentRepository.save(tournament);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @CacheEvict(value = "tournaments", allEntries = true)
    public ResponseEntity<Tournament> updateTournament(@PathVariable String id, @RequestBody Tournament tournament) {
        if (!tournamentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tournament.setId(id);
        Tournament updated = tournamentRepository.save(tournament);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @CacheEvict(value = "tournaments", allEntries = true)
    public ResponseEntity<Void> deleteTournament(@PathVariable String id) {
        if (!tournamentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tournamentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
