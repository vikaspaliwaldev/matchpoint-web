package io.matchpoint.controller;

import io.matchpoint.entity.Match;
import io.matchpoint.entity.MatchPoll;
import io.matchpoint.repository.MatchPollRepository;
import io.matchpoint.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/polls")
@RequiredArgsConstructor
public class MatchPollController {

    private final MatchPollRepository matchPollRepository;
    private final MatchRepository matchRepository;

    @GetMapping("/match/{matchId}")
    public ResponseEntity<List<MatchPoll>> getPollsByMatch(@PathVariable String matchId) {
        if (!matchRepository.existsById(matchId)) {
            return ResponseEntity.notFound().build();
        }
        
        List<MatchPoll> polls = matchPollRepository.findByMatchIdOrderByCreatedAtDesc(matchId);
        if (polls.isEmpty()) {
            // Automatically initialize the default "Who will win the match?" poll
            Match match = matchRepository.findById(matchId).orElse(null);
            if (match != null) {
                List<String> options = List.of(match.getPlayer1Name(), match.getPlayer2Name());
                List<Integer> votes = List.of(0, 0);
                
                MatchPoll defaultPoll = MatchPoll.builder()
                        .matchId(matchId)
                        .question("Who will win the match?")
                        .options(options)
                        .votes(votes)
                        .build();
                
                defaultPoll = matchPollRepository.save(defaultPoll);
                polls = List.of(defaultPoll);
            }
        }
        
        return ResponseEntity.ok(polls);
    }

    @PostMapping("/match/{matchId}")
    public ResponseEntity<MatchPoll> createCustomPoll(
            @PathVariable String matchId,
            @RequestBody MatchPoll customPoll) {
        
        if (!matchRepository.existsById(matchId)) {
            return ResponseEntity.notFound().build();
        }

        if (customPoll.getQuestion() == null || customPoll.getQuestion().trim().isEmpty() ||
            customPoll.getOptions() == null || customPoll.getOptions().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Initialize votes list matching the number of options with zeros
        List<Integer> initialVotes = new ArrayList<>();
        for (int i = 0; i < customPoll.getOptions().size(); i++) {
            initialVotes.add(0);
        }

        MatchPoll poll = MatchPoll.builder()
                .matchId(matchId)
                .question(customPoll.getQuestion().trim())
                .options(customPoll.getOptions())
                .votes(initialVotes)
                .build();

        MatchPoll saved = matchPollRepository.save(poll);
        return ResponseEntity.status(201).body(saved);
    }

    @PostMapping("/{pollId}/vote")
    public ResponseEntity<MatchPoll> vote(
            @PathVariable java.util.UUID pollId,
            @RequestParam("optionIndex") int optionIndex) {
        
        MatchPoll poll = matchPollRepository.findById(pollId).orElse(null);
        if (poll == null) {
            return ResponseEntity.notFound().build();
        }

        if (optionIndex < 0 || optionIndex >= poll.getOptions().size()) {
            return ResponseEntity.badRequest().build();
        }

        // Increment the vote count at the given index (needs to handle mutable/immutable lists)
        List<Integer> currentVotes = new ArrayList<>(poll.getVotes());
        currentVotes.set(optionIndex, currentVotes.get(optionIndex) + 1);
        poll.setVotes(currentVotes);

        MatchPoll saved = matchPollRepository.save(poll);
        return ResponseEntity.ok(saved);
    }
}
