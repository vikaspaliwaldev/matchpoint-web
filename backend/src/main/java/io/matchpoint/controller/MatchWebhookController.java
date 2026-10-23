package io.matchpoint.controller;

import io.matchpoint.entity.Match;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class MatchWebhookController {

    private final LiveMatchSseController liveMatchSseController;

    @PostMapping("/matches")
    public ResponseEntity<Void> handleMatchWebhook(@RequestBody SupabaseWebhookPayload payload) {
        log.info("🔌 Received database webhook from Supabase: {} on table {}", payload.getType(), payload.getTable());
        
        if ("matches".equalsIgnoreCase(payload.getTable())) {
            Match matchRecord = payload.getRecord();
            if (matchRecord != null) {
                // If it's an UPDATE or INSERT, broadcast the new match state
                if ("UPDATE".equalsIgnoreCase(payload.getType()) || "INSERT".equalsIgnoreCase(payload.getType())) {
                    log.info("📢 Match updated/inserted in DB, broadcasting SSE update for match ID: {}", matchRecord.getId());
                    liveMatchSseController.broadcastMatchUpdate(matchRecord.getId(), matchRecord);
                }
            } else {
                log.warn("⚠️ Received matches webhook but 'record' field is null!");
            }
        }
        
        return ResponseEntity.ok().build();
    }

    @Data
    public static class SupabaseWebhookPayload {
        private String type; // "INSERT", "UPDATE", "DELETE"
        private String table;
        private String schema;
        private Match record;
        
        @com.fasterxml.jackson.annotation.JsonProperty("old_record")
        private Match oldRecord;
    }
}
