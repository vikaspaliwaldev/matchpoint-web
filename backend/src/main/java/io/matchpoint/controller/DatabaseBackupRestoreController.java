package io.matchpoint.controller;

import io.matchpoint.entity.RestoreRequest;
import io.matchpoint.service.DatabaseBackupRestoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/db")
@RequiredArgsConstructor
public class DatabaseBackupRestoreController {

    private final DatabaseBackupRestoreService backupRestoreService;

    /**
     * Export database backup as a JSON download.
     */
    @GetMapping("/backup")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, List<Map<String, Object>>>> backupDatabase() {
        Map<String, List<Map<String, Object>>> backup = backupRestoreService.backupDatabase();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=matchpoint_backup_" + System.currentTimeMillis() + ".json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(backup);
    }

    /**
     * Step 1: Admin A initiates a database restore request.
     */
    @PostMapping("/restore/request")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<RestoreRequest> requestRestore(@RequestBody String backupDataJSON) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentAdmin = auth != null ? auth.getName() : "system";
        RestoreRequest request = backupRestoreService.createRestoreRequest(backupDataJSON, currentAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(request);
    }

    /**
     * Step 2: Retrieve the list of active pending restore requests.
     */
    @GetMapping("/restore/requests")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<List<RestoreRequest>> getPendingRestores() {
        List<RestoreRequest> pending = backupRestoreService.getPendingRestores();
        return ResponseEntity.ok(pending);
    }

    /**
     * Step 3: Admin B (different user) approves and triggers the database restore execution.
     */
    @PostMapping("/restore/approve/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> approveRestore(@PathVariable UUID id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentAdmin = auth != null ? auth.getName() : "system";
        try {
            backupRestoreService.approveAndExecuteRestore(id, currentAdmin);
            return ResponseEntity.ok(Map.of("message", "Database successfully restored."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Reject and archive a restore request.
     */
    @PostMapping("/restore/reject/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> rejectRestore(@PathVariable UUID id) {
        backupRestoreService.rejectRestore(id);
        return ResponseEntity.ok(Map.of("message", "Restore request successfully rejected."));
    }
}
