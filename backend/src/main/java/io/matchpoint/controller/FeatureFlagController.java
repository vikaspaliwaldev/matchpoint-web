package io.matchpoint.controller;

import io.matchpoint.entity.FeatureFlag;
import io.matchpoint.repository.FeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/features")
@RequiredArgsConstructor
public class FeatureFlagController {

    private final FeatureFlagRepository featureFlagRepository;

    @GetMapping
    public ResponseEntity<Map<String, Boolean>> getAllFeatures() {
        Map<String, Boolean> activeFlags = new HashMap<>();
        featureFlagRepository.findAll().forEach(flag -> 
            activeFlags.put(flag.getFlagKey(), flag.isEnabled())
        );
        return ResponseEntity.ok(activeFlags);
    }

    @PutMapping("/{flagKey}/toggle")
    public ResponseEntity<Map<String, Object>> toggleFeature(@PathVariable String flagKey, @RequestParam boolean enabled) {
        Optional<FeatureFlag> flagOpt = featureFlagRepository.findByFlagKey(flagKey);
        Map<String, Object> response = new HashMap<>();
        
        if (flagOpt.isPresent()) {
            FeatureFlag flag = flagOpt.get();
            flag.setEnabled(enabled);
            featureFlagRepository.save(flag);
            
            response.put("success", true);
            response.put("flagKey", flagKey);
            response.put("isEnabled", enabled);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Feature flag not found: " + flagKey);
            return ResponseEntity.status(404).body(response);
        }
    }
}
