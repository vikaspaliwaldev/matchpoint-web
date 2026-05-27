package io.matchpoint.repository;

import io.matchpoint.entity.TournamentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TournamentEventRepository extends JpaRepository<TournamentEvent, String> {
    List<TournamentEvent> findByTournamentId(String tournamentId);
}
