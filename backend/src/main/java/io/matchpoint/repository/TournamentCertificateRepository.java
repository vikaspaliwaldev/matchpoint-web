package io.matchpoint.repository;

import io.matchpoint.entity.TournamentCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TournamentCertificateRepository extends JpaRepository<TournamentCertificate, String> {
    Optional<TournamentCertificate> findByTournamentId(String tournamentId);
}
