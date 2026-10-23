package io.matchpoint.repository;

import io.matchpoint.entity.Tournament;
import io.matchpoint.dto.TournamentSummaryDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, String> {
    Optional<Tournament> findBySlug(String slug);
    boolean existsByName(String name);

    @Query("SELECT t FROM Tournament t")
    List<TournamentSummaryDto> findAllSummaries();
}
