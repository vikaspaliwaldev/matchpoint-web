package io.matchpoint.controller;

import io.matchpoint.entity.EventMaster;
import io.matchpoint.repository.EventMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/master-events")
@RequiredArgsConstructor
public class EventMasterController {

    private final EventMasterRepository masterRepository;

    @GetMapping
    public List<EventMaster> getAllMasterEvents() {
        return masterRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventMaster> getMasterEventById(@PathVariable String id) {
        return masterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EventMaster> createMasterEvent(@RequestBody EventMaster eventMaster) {
        EventMaster saved = masterRepository.save(eventMaster);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventMaster> updateMasterEvent(@PathVariable String id, @RequestBody EventMaster eventMaster) {
        if (!masterRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        eventMaster.setId(id);
        EventMaster updated = masterRepository.save(eventMaster);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMasterEvent(@PathVariable String id) {
        if (!masterRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        masterRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
