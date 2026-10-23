package io.matchpoint.repository;

import io.matchpoint.entity.TournamentMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TournamentMediaRepository extends JpaRepository<TournamentMedia, String> {
    List<TournamentMedia> findByTournamentIdOrderByCreatedAtDesc(String tournamentId);
    List<TournamentMedia> findByMatchIdOrderByCreatedAtDesc(String matchId);
}
