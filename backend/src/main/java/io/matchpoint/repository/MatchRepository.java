package io.matchpoint.repository;

import io.matchpoint.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, String> {
    List<Match> findByEventId(String eventId);
    List<Match> findByTournamentId(String tournamentId);
    List<Match> findByUmpireId(String umpireId);
    List<Match> findByPlayer1IdOrPlayer2Id(String player1Id, String player2Id);
    List<Match> findByStatusIn(List<String> statuses);
    List<Match> findByStatus(String status);

    @Modifying
    @Query("UPDATE Match m SET m.maxViewers = :count WHERE m.status = 'running' AND (m.maxViewers IS NULL OR m.maxViewers < :count)")
    int updateRunningMatchesMaxViewers(@Param("count") int count);
}
