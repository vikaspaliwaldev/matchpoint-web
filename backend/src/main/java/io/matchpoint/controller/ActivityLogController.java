package io.matchpoint.controller;

import io.matchpoint.entity.ActivityLog;
import io.matchpoint.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;

    /**
     * Authenticated endpoint to fetch rolling activity logs.
     */
    @GetMapping("/api/v1/activity-logs")
    public List<ActivityLog> getAllActivityLogs() {
        return activityLogRepository.findAll();
    }

    /**
     * Authenticated endpoint to log telemetry.
     */
    @PostMapping("/api/v1/activity-logs")
    public ResponseEntity<ActivityLog> logAuthenticatedActivity(@RequestBody ActivityLog log) {
        ActivityLog saved = activityLogRepository.save(log);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Public guest-accessible endpoint to log telemetry.
     * Whitelisted under /api/v1/public/** in SecurityConfig.
     */
    @PostMapping("/api/v1/public/activity-logs")
    public ResponseEntity<ActivityLog> logPublicGuestActivity(@RequestBody ActivityLog log) {
        // Ensure guest safety parameters are active
        if (log.getUserId() == null || log.getUserId().trim().isEmpty()) {
            log.setUserId("GUEST");
        }
        if (log.getUserName() == null || log.getUserName().trim().isEmpty()) {
            log.setUserName("Anonymous Visitor");
        }
        ActivityLog saved = activityLogRepository.save(log);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
