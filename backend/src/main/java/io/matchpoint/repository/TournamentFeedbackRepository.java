package io.matchpoint.repository;

import io.matchpoint.entity.TournamentFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TournamentFeedbackRepository extends JpaRepository<TournamentFeedback, UUID> {
    List<TournamentFeedback> findByTournamentId(String tournamentId);
}
