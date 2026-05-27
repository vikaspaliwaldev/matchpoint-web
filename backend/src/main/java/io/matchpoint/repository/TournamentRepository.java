package io.matchpoint.repository;

import io.matchpoint.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, String> {
    Optional<Tournament> findBySlug(String slug);
}
