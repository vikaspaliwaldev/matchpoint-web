package io.matchpoint.repository;

import io.matchpoint.entity.UserLogin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface UserLoginRepository extends JpaRepository<UserLogin, UUID> {
    
    @Modifying
    @Query("DELETE FROM UserLogin ul WHERE ul.loginTime < :cutoff")
    int deleteOldLogins(LocalDateTime cutoff);
}
