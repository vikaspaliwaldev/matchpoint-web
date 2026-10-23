package io.matchpoint.repository;

import io.matchpoint.entity.MatchPoll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface MatchPollRepository extends JpaRepository<MatchPoll, UUID> {
    List<MatchPoll> findByMatchIdOrderByCreatedAtDesc(String matchId);
}
