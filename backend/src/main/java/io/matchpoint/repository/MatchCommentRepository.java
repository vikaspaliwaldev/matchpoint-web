package io.matchpoint.repository;

import io.matchpoint.entity.MatchComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatchCommentRepository extends JpaRepository<MatchComment, String> {
    List<MatchComment> findByMatchIdOrderByCreatedAtAsc(String matchId);
}
