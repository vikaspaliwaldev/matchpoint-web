package io.matchpoint.controller;

import io.matchpoint.entity.Profile;
import io.matchpoint.entity.AuditLog;
import io.matchpoint.repository.ProfileRepository;
import io.matchpoint.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileRepository profileRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public List<Profile> getAllProfiles() {
        return profileRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profile> getProfileById(@PathVariable String id) {
        return profileRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Profile> createProfile(@RequestBody Profile profile) {
        String email = profile.getEmail() != null ? profile.getEmail().trim().toLowerCase() : null;
        String name = profile.getName() != null ? profile.getName().trim() : null;
        java.time.LocalDate dob = profile.getDateOfBirth();

        java.util.Optional<Profile> matchedProfile = java.util.Optional.empty();

        // 1. Try matching by Name + DOB combination if available
        if (name != null && !name.isEmpty() && dob != null) {
            matchedProfile = profileRepository.findByNameIgnoreCaseAndDateOfBirth(name, dob);
        }

        // 2. If not matched, try matching by email
        if (matchedProfile.isEmpty() && email != null && !email.isEmpty()) {
            matchedProfile = profileRepository.findByEmail(email);
        }

        // 3. If player already exists, update email/mobile/gender/age if provided
        if (matchedProfile.isPresent()) {
            Profile existing = matchedProfile.get();
            boolean updated = false;

            if (email != null && !email.isEmpty() && !email.equalsIgnoreCase(existing.getEmail())) {
                existing.setEmail(email);
                updated = true;
            }
            if (profile.getPhone() != null && !profile.getPhone().trim().isEmpty() && !profile.getPhone().equals(existing.getPhone())) {
                existing.setPhone(profile.getPhone().trim());
                updated = true;
            }
            if (profile.getGender() != null && !profile.getGender().trim().isEmpty() && existing.getGender() == null) {
                existing.setGender(profile.getGender().trim());
                updated = true;
            }
            if (dob != null && existing.getDateOfBirth() == null) {
                existing.setDateOfBirth(dob);
                existing.setAge(java.time.Period.between(dob, java.time.LocalDate.now()).getYears());
                updated = true;
            } else if (profile.getAge() != null && existing.getAge() == null) {
                existing.setAge(profile.getAge());
                updated = true;
            }

            if (updated) {
                existing = profileRepository.save(existing);
            }
            return ResponseEntity.ok(existing);
        }

        // 4. If player does not exist, create new player
        if (email == null || email.isEmpty()) {
            email = "player." + System.currentTimeMillis() + "@matchpoint.internal";
        }
        if (profile.getId() == null || profile.getId().trim().isEmpty()) {
            profile.setId("u-" + java.util.UUID.randomUUID().toString().substring(0, 8));
        }
        profile.setEmail(email);
        if (name != null) profile.setName(name);
        if (profile.getRoles() == null || profile.getRoles().length == 0) {
            profile.setRoles(new String[]{"player"});
        }
        if (dob != null && profile.getAge() == null) {
            profile.setAge(java.time.Period.between(dob, java.time.LocalDate.now()).getYears());
        }
        Profile saved = profileRepository.save(profile);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Profile> updateProfile(@PathVariable String id, @RequestBody Profile profileDetails) {
        return profileRepository.findById(id)
                .map(profile -> {
                    profile.setName(profileDetails.getName());
                    profile.setPhone(profileDetails.getPhone());
                    profile.setGender(profileDetails.getGender());
                    if (profileDetails.getDateOfBirth() != null) {
                        profile.setDateOfBirth(profileDetails.getDateOfBirth());
                        profile.setAge(java.time.Period.between(profileDetails.getDateOfBirth(), java.time.LocalDate.now()).getYears());
                    } else if (profileDetails.getAge() != null) {
                        profile.setAge(profileDetails.getAge());
                    }
                    if (profileDetails.getAvatar() != null) {
                        profile.setAvatar(profileDetails.getAvatar());
                    }
                    Profile updated = profileRepository.save(profile);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/roles")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Profile> updateProfileRoles(
            @PathVariable String id, 
            @RequestBody String[] roles,
            org.springframework.security.core.Authentication authentication) {
        
        return profileRepository.findById(id)
                .map(profile -> {
                    String adminUsername = authentication != null ? authentication.getName() : "Administrator";
                    String adminName = profileRepository.findByEmail(adminUsername)
                            .map(Profile::getName)
                            .orElse(adminUsername);
                    String adminId = profileRepository.findByEmail(adminUsername)
                            .map(Profile::getId)
                            .orElse(null);

                    String oldRoles = String.join(", ", profile.getRoles() != null ? profile.getRoles() : new String[0]);
                    String newRoles = String.join(", ", roles != null ? roles : new String[0]);

                    profile.setRoles(roles);
                    Profile updated = profileRepository.save(profile);

                    // Create Audit Log
                    AuditLog log = AuditLog.builder()
                            .id("al-" + java.util.UUID.randomUUID().toString().substring(0, 8))
                            .action("User Role Changed")
                            .category("auth")
                            .userId(adminId)
                            .userName(adminName)
                            .details(String.format("Changed roles for user '%s' (%s) from [%s] to [%s]", 
                                    profile.getName(), profile.getEmail(), oldRoles, newRoles))
                            .build();
                    
                    auditLogRepository.save(log);

                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
