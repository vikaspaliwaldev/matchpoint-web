package io.matchpoint.controller;

import io.matchpoint.entity.TournamentEvent;
import io.matchpoint.repository.TournamentEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final TournamentEventRepository eventRepository;

    @GetMapping
    public List<TournamentEvent> getAllEvents() {
        return eventRepository.findAll();
    }

    @GetMapping("/tournament/{tournamentId}")
    public List<TournamentEvent> getEventsByTournament(@PathVariable String tournamentId) {
        return eventRepository.findByTournamentId(tournamentId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentEvent> getEventById(@PathVariable String id) {
        return eventRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TournamentEvent> createEvent(@RequestBody TournamentEvent event) {
        TournamentEvent saved = eventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TournamentEvent> updateEvent(@PathVariable String id, @RequestBody TournamentEvent event) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        event.setId(id);
        TournamentEvent updated = eventRepository.save(event);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
