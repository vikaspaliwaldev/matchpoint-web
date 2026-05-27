package io.matchpoint.repository;

import io.matchpoint.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, String> {
    List<Registration> findByEventId(String eventId);
    List<Registration> findByTournamentId(String tournamentId);
    List<Registration> findByPlayerId(String playerId);
}
