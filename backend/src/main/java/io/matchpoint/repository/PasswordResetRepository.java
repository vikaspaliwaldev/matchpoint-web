package io.matchpoint.repository;

import io.matchpoint.entity.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordReset, UUID> {
    Optional<PasswordReset> findTopByEmailOrderByCreatedAtDesc(String email);
    Optional<PasswordReset> findByResetToken(String resetToken);
}
