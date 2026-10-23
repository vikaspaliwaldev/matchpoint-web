package io.matchpoint.controller;

import io.matchpoint.entity.TournamentMedia;
import io.matchpoint.entity.AuditLog;
import io.matchpoint.entity.Profile;
import io.matchpoint.repository.TournamentMediaRepository;
import io.matchpoint.repository.AuditLogRepository;
import io.matchpoint.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tournaments/{tournamentId}/media")
@RequiredArgsConstructor
public class TournamentMediaController {

    private final TournamentMediaRepository tournamentMediaRepository;
    private final AuditLogRepository auditLogRepository;
    private final ProfileRepository profileRepository;

    @GetMapping
    public List<TournamentMedia> getMedia(@PathVariable String tournamentId) {
        return tournamentMediaRepository.findByTournamentIdOrderByCreatedAtDesc(tournamentId);
    }

    @PostMapping
    public ResponseEntity<TournamentMedia> uploadMedia(
            @PathVariable String tournamentId,
            @RequestBody TournamentMedia mediaDetails,
            org.springframework.security.core.Authentication authentication) {

        String username = authentication != null ? authentication.getName() : "Anonymous";
        String userId = profileRepository.findByEmail(username)
                .map(Profile::getId)
                .orElse(null);
        String userName = profileRepository.findByEmail(username)
                .map(Profile::getName)
                .orElse(username);

        TournamentMedia media = TournamentMedia.builder()
                .id("media-" + UUID.randomUUID().toString().substring(0, 8))
                .tournamentId(tournamentId)
                .uploadedBy(userId)
                .fileUrl(mediaDetails.getFileUrl())
                .caption(mediaDetails.getCaption())
                .mediaType(mediaDetails.getMediaType() != null ? mediaDetails.getMediaType() : "image")
                .build();

        TournamentMedia saved = tournamentMediaRepository.save(media);

        // Audit Log
        AuditLog log = AuditLog.builder()
                .id("al-" + UUID.randomUUID().toString().substring(0, 8))
                .action("Tournament Media Uploaded")
                .category("tournament")
                .userId(userId)
                .userName(userName)
                .details(String.format("Uploaded media item to tournament '%s' (Caption: %s)", 
                        tournamentId, mediaDetails.getCaption()))
                .build();
        auditLogRepository.save(log);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMedia(
            @PathVariable String tournamentId,
            @PathVariable String id,
            org.springframework.security.core.Authentication authentication) {

        return tournamentMediaRepository.findById(id)
                .map(media -> {
                    String username = authentication != null ? authentication.getName() : "Administrator";
                    String userId = profileRepository.findByEmail(username)
                            .map(Profile::getId)
                            .orElse(null);
                    String userName = profileRepository.findByEmail(username)
                            .map(Profile::getName)
                            .orElse(username);

                    tournamentMediaRepository.delete(media);

                    // Audit Log
                    AuditLog log = AuditLog.builder()
                            .id("al-" + UUID.randomUUID().toString().substring(0, 8))
                            .action("Tournament Media Deleted")
                            .category("tournament")
                            .userId(userId)
                            .userName(userName)
                            .details(String.format("Deleted media item '%s' from tournament '%s'", 
                                    id, tournamentId))
                            .build();
                    auditLogRepository.save(log);

                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
