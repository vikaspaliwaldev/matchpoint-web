package io.matchpoint.repository;

import io.matchpoint.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    
    @Modifying
    @Query("DELETE FROM ActivityLog al WHERE al.createdAt < :cutoff")
    int deleteOldActivityLogs(LocalDateTime cutoff);
}
