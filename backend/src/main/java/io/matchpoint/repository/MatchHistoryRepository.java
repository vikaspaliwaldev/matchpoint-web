package io.matchpoint.repository;

import io.matchpoint.entity.MatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MatchHistoryRepository extends JpaRepository<MatchHistory, String> {
    Optional<MatchHistory> findByMatchId(String matchId);
    List<MatchHistory> findByTournamentIdOrderByCreatedAtDesc(String tournamentId);
    List<MatchHistory> findByEventIdOrderByCreatedAtDesc(String eventId);
}
