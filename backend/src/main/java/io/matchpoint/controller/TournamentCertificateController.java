package io.matchpoint.controller;

import io.matchpoint.entity.TournamentCertificate;
import io.matchpoint.repository.TournamentCertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tournaments/{tournamentId}/certificate")
@RequiredArgsConstructor
public class TournamentCertificateController {

    private final TournamentCertificateRepository repository;

    @GetMapping
    public ResponseEntity<TournamentCertificate> getCertificateByTournament(@PathVariable String tournamentId) {
        return repository.findByTournamentId(tournamentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TournamentCertificate> saveCertificate(
            @PathVariable String tournamentId,
            @RequestBody TournamentCertificate certificate) {
        
        TournamentCertificate existing = repository.findByTournamentId(tournamentId).orElse(null);
        if (existing != null) {
            certificate.setId(existing.getId());
        } else {
            certificate.setId("cert-" + UUID.randomUUID().toString());
        }
        
        certificate.setTournamentId(tournamentId);
        TournamentCertificate saved = repository.save(certificate);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
