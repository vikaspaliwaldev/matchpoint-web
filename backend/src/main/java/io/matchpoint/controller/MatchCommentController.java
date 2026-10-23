package io.matchpoint.controller;

import io.matchpoint.entity.MatchComment;
import io.matchpoint.entity.Profile;
import io.matchpoint.repository.MatchCommentRepository;
import io.matchpoint.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/matches/{matchId}/comments")
@RequiredArgsConstructor
public class MatchCommentController {

    private final MatchCommentRepository matchCommentRepository;
    private final ProfileRepository profileRepository;

    @GetMapping
    public List<MatchComment> getComments(@PathVariable String matchId) {
        return matchCommentRepository.findByMatchIdOrderByCreatedAtAsc(matchId);
    }

    @PostMapping
    public ResponseEntity<MatchComment> postComment(
            @PathVariable String matchId,
            @RequestBody MatchComment commentDetails,
            org.springframework.security.core.Authentication authentication) {

        String username = authentication != null ? authentication.getName() : "Anonymous";
        String userId = profileRepository.findByEmail(username)
                .map(Profile::getId)
                .orElse(null);
        String userName = profileRepository.findByEmail(username)
                .map(Profile::getName)
                .orElse(commentDetails.getUserName() != null ? commentDetails.getUserName() : "Anonymous Spectator");

        MatchComment comment = MatchComment.builder()
                .id("comm-" + UUID.randomUUID().toString().substring(0, 8))
                .matchId(matchId)
                .userId(userId)
                .userName(userName)
                .message(commentDetails.getMessage())
                .build();

        MatchComment saved = matchCommentRepository.save(comment);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String matchId,
            @PathVariable String id) {

        return matchCommentRepository.findById(id)
                .map(comment -> {
                    matchCommentRepository.delete(comment);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
