package io.matchpoint.controller;

import io.matchpoint.entity.TournamentFeedback;
import io.matchpoint.repository.TournamentFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class TournamentFeedbackController {

    private final TournamentFeedbackRepository repository;

    // Public Endpoint (no auth needed, automatically permitted under /api/v1/public/**)
    @PostMapping("/api/v1/public/tournaments/{tournamentId}/feedback")
    public ResponseEntity<TournamentFeedback> createFeedback(
            @PathVariable String tournamentId,
            @RequestBody TournamentFeedback feedback) {
        feedback.setTournamentId(tournamentId);
        if (feedback.getUserName() == null || feedback.getUserName().trim().isEmpty()) {
            feedback.setUserName("Anonymous");
        }
        TournamentFeedback saved = repository.save(feedback);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Secured Endpoint (for tournament co-admins review)
    @GetMapping("/api/v1/tournaments/{tournamentId}/feedback")
    public List<TournamentFeedback> getFeedbackByTournament(@PathVariable String tournamentId) {
        return repository.findByTournamentId(tournamentId);
    }
}
