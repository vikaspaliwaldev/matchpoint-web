package io.matchpoint.controller;

import io.matchpoint.entity.TournamentMedia;
import io.matchpoint.entity.Match;
import io.matchpoint.entity.AuditLog;
import io.matchpoint.entity.Profile;
import io.matchpoint.repository.TournamentMediaRepository;
import io.matchpoint.repository.MatchRepository;
import io.matchpoint.repository.AuditLogRepository;
import io.matchpoint.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MatchMediaController {

    private final TournamentMediaRepository tournamentMediaRepository;
    private final MatchRepository matchRepository;
    private final AuditLogRepository auditLogRepository;
    private final ProfileRepository profileRepository;

    @GetMapping("/api/v1/matches/{matchId}/media")
    public List<TournamentMedia> getMatchMedia(@PathVariable String matchId) {
        return tournamentMediaRepository.findByMatchIdOrderByCreatedAtDesc(matchId);
    }

    @PostMapping("/api/v1/matches/{matchId}/media")
    public ResponseEntity<?> uploadMatchMedia(
            @PathVariable String matchId,
            @RequestBody TournamentMedia mediaDetails,
            org.springframework.security.core.Authentication authentication) {

        String username = authentication != null ? authentication.getName() : "Anonymous";
        Profile profile = profileRepository.findByEmail(username).orElse(null);
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User profile not found.");
        }

        Match match = matchRepository.findById(matchId).orElse(null);
        if (match == null) {
            return ResponseEntity.notFound().build();
        }

        // Check if user is Admin, Umpire of the match, or a Broadcaster
        boolean isAdmin = java.util.Arrays.asList(profile.getRoles() != null ? profile.getRoles() : new String[0])
                .stream().anyMatch(role -> role.equalsIgnoreCase("admin"));
        boolean isUmpire = match.getUmpireId() != null && match.getUmpireId().equals(profile.getId());
        boolean isBroadcaster = java.util.Arrays.asList(profile.getRoles() != null ? profile.getRoles() : new String[0])
                .stream().anyMatch(role -> role.equalsIgnoreCase("broadcaster"));

        if (!isAdmin && !isUmpire && !isBroadcaster) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admin, the assigned umpire, or a broadcaster can upload media.");
        }

        TournamentMedia media = TournamentMedia.builder()
                .id("media-" + UUID.randomUUID().toString().substring(0, 8))
                .tournamentId(match.getTournamentId())
                .matchId(matchId)
                .uploadedBy(profile.getId())
                .fileUrl(mediaDetails.getFileUrl())
                .caption(mediaDetails.getCaption())
                .mediaType(mediaDetails.getMediaType() != null ? mediaDetails.getMediaType() : "image")
                .build();

        TournamentMedia saved = tournamentMediaRepository.save(media);

        // Audit Log
        AuditLog log = AuditLog.builder()
                .id("al-" + UUID.randomUUID().toString().substring(0, 8))
                .action("Match Media Uploaded")
                .category("match")
                .userId(profile.getId())
                .userName(profile.getName())
                .details(String.format("Uploaded media item to match '%s' (Caption: %s)", 
                        matchId, mediaDetails.getCaption()))
                .build();
        auditLogRepository.save(log);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/api/v1/matches/{matchId}/media/{mediaId}")
    public ResponseEntity<?> deleteMatchMedia(
            @PathVariable String matchId,
            @PathVariable String mediaId,
            org.springframework.security.core.Authentication authentication) {

        String username = authentication != null ? authentication.getName() : "Anonymous";
        Profile profile = profileRepository.findByEmail(username).orElse(null);
        if (profile == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User profile not found.");
        }

        TournamentMedia media = tournamentMediaRepository.findById(mediaId).orElse(null);
        if (media == null) {
            return ResponseEntity.notFound().build();
        }

        Match match = matchRepository.findById(matchId).orElse(null);
        if (match == null) {
            return ResponseEntity.notFound().build();
        }

        // Check if user is Admin, the Umpire of the match, or the uploader of the media
        boolean isAdmin = java.util.Arrays.asList(profile.getRoles() != null ? profile.getRoles() : new String[0])
                .stream().anyMatch(role -> role.equalsIgnoreCase("admin"));
        boolean isUmpire = match.getUmpireId() != null && match.getUmpireId().equals(profile.getId());
        boolean isUploader = media.getUploadedBy() != null && media.getUploadedBy().equals(profile.getId());

        if (!isAdmin && !isUmpire && !isUploader) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admin, the assigned umpire, or the uploader can delete this media.");
        }

        tournamentMediaRepository.delete(media);

        // Audit Log
        AuditLog log = AuditLog.builder()
                .id("al-" + UUID.randomUUID().toString().substring(0, 8))
                .action("Match Media Deleted")
                .category("match")
                .userId(profile.getId())
                .userName(profile.getName())
                .details(String.format("Deleted media item '%s' from match '%s'", 
                        mediaId, matchId))
                .build();
        auditLogRepository.save(log);

        return ResponseEntity.ok().build();
    }
}
