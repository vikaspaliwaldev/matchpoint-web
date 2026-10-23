package io.matchpoint.controller;

import io.matchpoint.entity.Match;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/v1/live")
@CrossOrigin(origins = "*")
@Slf4j
public class LiveMatchSseController {

    // Active emitters grouped by matchId
    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    @GetMapping(path = "/match/{matchId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToMatch(@PathVariable String matchId) {
        log.info("🔌 Spectator connected to SSE stream for match: {}", matchId);
        
        // Timeout set to 30 minutes (1800000ms) or max value
        SseEmitter emitter = new SseEmitter(1800000L);
        
        emitters.computeIfAbsent(matchId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(matchId, emitter));
        emitter.onTimeout(() -> removeEmitter(matchId, emitter));
        emitter.onError((e) -> removeEmitter(matchId, emitter));

        // Send initial heartbeat to establish connection successfully
        try {
            emitter.send(SseEmitter.event()
                    .name("ping")
                    .data("connected"));
        } catch (IOException e) {
            removeEmitter(matchId, emitter);
        }

        return emitter;
    }

    /**
     * Broadcasts match details to all active SSE subscribers for the match.
     */
    public void broadcastMatchUpdate(String matchId, Match match) {
        List<SseEmitter> matchEmitters = emitters.get(matchId);
        if (matchEmitters != null && !matchEmitters.isEmpty()) {
            log.info("📢 Broadcasting match update for {} to {} connected clients", matchId, matchEmitters.size());
            List<SseEmitter> deadEmitters = new ArrayList<>();
            
            for (SseEmitter emitter : matchEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("match-update")
                            .data(match));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }
            
            if (!deadEmitters.isEmpty()) {
                matchEmitters.removeAll(deadEmitters);
            }
        }
    }

    private void removeEmitter(String matchId, SseEmitter emitter) {
        List<SseEmitter> matchEmitters = emitters.get(matchId);
        if (matchEmitters != null) {
            matchEmitters.remove(emitter);
            if (matchEmitters.isEmpty()) {
                emitters.remove(matchId);
            }
            log.info("🔌 Disconnected spectator SSE stream from match: {}", matchId);
        }
    }
}
