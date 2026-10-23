package io.matchpoint.controller;

import io.matchpoint.entity.SupportRequest;
import io.matchpoint.repository.SupportRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class SupportRequestController {

    private final SupportRequestRepository repository;

    // Public Endpoint (no auth needed, automatically permitted under /api/v1/public/**)
    @PostMapping("/api/v1/public/support")
    public ResponseEntity<SupportRequest> createSupportRequest(@RequestBody SupportRequest request) {
        request.setStatus("open");
        SupportRequest saved = repository.save(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Secured Endpoint (for admin review)
    @GetMapping("/api/v1/support")
    public List<SupportRequest> getAllSupportRequests() {
        return repository.findAll();
    }
}
