package io.matchpoint.repository;

import io.matchpoint.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, String> {
    List<Match> findByEventId(String eventId);
    List<Match> findByTournamentId(String tournamentId);
    List<Match> findByUmpireId(String umpireId);
    List<Match> findByPlayer1IdOrPlayer2Id(String player1Id, String player2Id);
}
