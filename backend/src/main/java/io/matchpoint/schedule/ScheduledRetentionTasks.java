package io.matchpoint.schedule;

import io.matchpoint.repository.ActivityLogRepository;
import io.matchpoint.repository.UserLoginRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledRetentionTasks {

    private final UserLoginRepository userLoginRepository;
    private final ActivityLogRepository activityLogRepository;

    /**
     * Daily cleanup for user logins older than 180 days.
     * Runs daily at midnight.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void pruneExpiredLoginHistory() {
        log.info("Starting scheduled pruning of user logins older than 180 days...");
        LocalDateTime cutoff = LocalDateTime.now().minusDays(180);
        int deletedCount = userLoginRepository.deleteOldLogins(cutoff);
        log.info("Pruning complete. Deleted {} user login logs.", deletedCount);
    }

    /**
     * Daily cleanup for rolling activity telemetry logs older than 15 days.
     * Runs daily at 1:00 AM.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void pruneExpiredActivityTelemetry() {
        log.info("Starting scheduled pruning of activity telemetry logs older than 15 days...");
        LocalDateTime cutoff = LocalDateTime.now().minusDays(15);
        int deletedCount = activityLogRepository.deleteOldActivityLogs(cutoff);
        log.info("Telemetry pruning complete. Deleted {} rolling activity logs.", deletedCount);
    }
}
