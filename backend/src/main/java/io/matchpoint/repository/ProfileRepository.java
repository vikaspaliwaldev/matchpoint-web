package io.matchpoint.repository;

import io.matchpoint.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, String> {
    Optional<Profile> findByEmail(String email);
    Optional<Profile> findByNameIgnoreCaseAndDateOfBirth(String name, java.time.LocalDate dateOfBirth);
    List<Profile> findByNameIgnoreCase(String name);

    @Query(value = "SELECT COUNT(*) FROM profiles WHERE :role = ANY(roles)", nativeQuery = true)
    long countByRolesContaining(@Param("role") String role);
}
