package io.matchpoint.controller;

import io.matchpoint.entity.AuditLog;
import io.matchpoint.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public List<AuditLog> getAllAuditLogs(@RequestParam(required = false) String category) {
        if (category != null && !category.trim().isEmpty() && !category.equals("all")) {
            return auditLogRepository.findByCategoryOrderByCreatedAtDesc(category);
        }
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<AuditLog> createAuditLog(@RequestBody AuditLog log) {
        AuditLog saved = auditLogRepository.save(log);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
