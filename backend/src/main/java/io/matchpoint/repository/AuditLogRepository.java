package io.matchpoint.repository;

import io.matchpoint.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByCategoryOrderByCreatedAtDesc(String category);
    List<AuditLog> findAllByOrderByCreatedAtDesc();
}
