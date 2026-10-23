package io.matchpoint.repository;

import io.matchpoint.entity.EventMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventMasterRepository extends JpaRepository<EventMaster, String> {
}
