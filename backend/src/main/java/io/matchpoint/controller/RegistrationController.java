package io.matchpoint.controller;

import io.matchpoint.entity.Profile;
import io.matchpoint.entity.Registration;
import io.matchpoint.entity.TournamentEvent;
import io.matchpoint.repository.ProfileRepository;
import io.matchpoint.repository.RegistrationRepository;
import io.matchpoint.repository.TournamentEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationRepository registrationRepository;
    private final ProfileRepository profileRepository;
    private final TournamentEventRepository tournamentEventRepository;

    @GetMapping
    public List<Registration> getAllRegistrations() {
        return registrationRepository.findAll();
    }

    @GetMapping("/event/{eventId}")
    public List<Registration> getRegistrationsByEvent(@PathVariable String eventId) {
        return registrationRepository.findByEventId(eventId);
    }

    @GetMapping("/tournament/{tournamentId}")
    public List<Registration> getRegistrationsByTournament(@PathVariable String tournamentId) {
        return registrationRepository.findByTournamentId(tournamentId);
    }

    @GetMapping("/player/{playerId}")
    public List<Registration> getRegistrationsByPlayer(@PathVariable String playerId) {
        return registrationRepository.findByPlayerId(playerId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Registration> getRegistrationById(@PathVariable String id) {
        return registrationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createRegistration(@RequestBody Registration registration) {
        // 1. Resolve or create primary player profile first
        String playerEmail = registration.getPlayerEmail() != null ? registration.getPlayerEmail().trim().toLowerCase() : null;
        String playerName = registration.getPlayerName() != null ? registration.getPlayerName().trim() : null;
        
        java.util.Optional<Profile> matchedProfile = java.util.Optional.empty();
        if (registration.getPlayerId() != null && !registration.getPlayerId().trim().isEmpty()) {
            matchedProfile = profileRepository.findById(registration.getPlayerId());
        }
        if (matchedProfile.isEmpty() && playerEmail != null && !playerEmail.isEmpty() && !playerEmail.contains("example.com")) {
            matchedProfile = profileRepository.findByEmail(playerEmail);
        }

        if (matchedProfile.isPresent()) {
            Profile existing = matchedProfile.get();
            registration.setPlayerId(existing.getId());
            boolean playerUpdated = false;
            if (playerEmail != null && !playerEmail.isEmpty() && !playerEmail.equalsIgnoreCase(existing.getEmail())) {
                existing.setEmail(playerEmail);
                playerUpdated = true;
            }
            if (playerName != null && !playerName.isEmpty() && !playerName.equals(existing.getName())) {
                existing.setName(playerName);
                playerUpdated = true;
            }
            if (playerUpdated) {
                profileRepository.save(existing);
            }
        } else {
            // Player does not exist - create new profile
            String newPlayerId = registration.getPlayerId();
            if (newPlayerId == null || newPlayerId.trim().isEmpty() || profileRepository.existsById(newPlayerId)) {
                newPlayerId = "u-" + java.util.UUID.randomUUID().toString().substring(0, 8);
            }
            registration.setPlayerId(newPlayerId);
            Profile newProfile = Profile.builder()
                    .id(newPlayerId)
                    .email(playerEmail != null && !playerEmail.isEmpty() ? playerEmail : newPlayerId + "@matchpoint.internal")
                    .name(playerName != null && !playerName.isEmpty() ? playerName : "Player")
                    .roles(new String[]{"player"})
                    .passwordHash(null)
                    .build();
            profileRepository.save(newProfile);
        }

        // Server-side validation
        if (registration.getPlayerId() != null && registration.getEventId() != null) {
            java.util.Optional<Profile> playerOpt = profileRepository.findById(registration.getPlayerId());
            java.util.Optional<TournamentEvent> eventOpt = tournamentEventRepository.findById(registration.getEventId());
            
            if (playerOpt.isPresent() && eventOpt.isPresent()) {
                Profile player = playerOpt.get();
                TournamentEvent event = eventOpt.get();
                
                // 1. Check gender restriction
                if (event.getGenderRestriction() != null && !event.getGenderRestriction().equalsIgnoreCase("open")) {
                    if (player.getGender() != null) {
                        boolean genderMatch = false;
                        String pGender = player.getGender().trim().toLowerCase();
                        String eRestriction = event.getGenderRestriction().trim().toLowerCase();
                        
                        if (eRestriction.equals("men") && (pGender.equals("men") || pGender.equals("male"))) {
                            genderMatch = true;
                        } else if (eRestriction.equals("women") && (pGender.equals("women") || pGender.equals("female"))) {
                            genderMatch = true;
                        } else if (eRestriction.equals("mixed")) {
                            genderMatch = true; // mixed allows anyone but is usually a mixed-pair event
                        }
                        
                        if (!genderMatch) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Player gender does not match the event restriction: " + event.getGenderRestriction());
                        }
                    }
                }
                
                // 2. Check age restriction
                if (event.getAgeLimit() != null && event.getAgeLimit() > 0 && player.getAge() != null) {
                    int pAge = player.getAge();
                    int limit = event.getAgeLimit();
                    String rType = event.getAgeRestrictionType() != null ? event.getAgeRestrictionType().trim().toLowerCase() : "max";
                    
                    if (rType.equals("max") && pAge > limit) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Player age (" + pAge + ") exceeds the maximum age limit of " + limit + " for this event.");
                    } else if (rType.equals("min") && pAge < limit) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Player age (" + pAge + ") is below the minimum age limit of " + limit + " for this event.");
                    }
                }
                
                // 3. Doubles Category Validations
                if (event.getCategory() != null && event.getCategory().trim().toUpperCase().endsWith("D")) {
                    String pName = registration.getPartnerName();
                    String pGender = registration.getPartnerGender();
                    
                    if (pName == null || pName.trim().isEmpty()) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("A partner name is required for doubles event registration.");
                    }
                    if (pGender == null || pGender.trim().isEmpty()) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("Partner gender is required for doubles event registration.");
                    }
                    
                    String pGenderNormalized = pGender.trim().toLowerCase();
                    String playerGenderNormalized = player.getGender() != null ? player.getGender().trim().toLowerCase() : "";
                    String eventCategory = event.getCategory().trim().toUpperCase();
                    
                    // Men's/Boys' Doubles (e.g. "MD", "B13D", "B15D", etc.)
                    if (eventCategory.equals("MD") || (eventCategory.startsWith("B") && eventCategory.endsWith("D"))) {
                        if (!playerGenderNormalized.isEmpty() && !playerGenderNormalized.equals("male") && !playerGenderNormalized.equals("men")) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Only male players are allowed in Men's/Boys' doubles events.");
                        }
                        if (!pGenderNormalized.equals("male") && !pGenderNormalized.equals("men")) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Partner must be male in Men's/Boys' doubles events.");
                        }
                    }
                    // Women's/Girls' Doubles (e.g. "WD", "G13D", "G15D", etc.)
                    else if (eventCategory.equals("WD") || (eventCategory.startsWith("G") && eventCategory.endsWith("D"))) {
                        if (!playerGenderNormalized.isEmpty() && !playerGenderNormalized.equals("female") && !playerGenderNormalized.equals("women")) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Only female players are allowed in Women's/Girls' doubles events.");
                        }
                        if (!pGenderNormalized.equals("female") && !pGenderNormalized.equals("women")) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Partner must be female in Women's/Girls' doubles events.");
                        }
                    }
                    // Mixed Doubles (e.g. "XD")
                    else if (eventCategory.equals("XD") || (event.getGenderRestriction() != null && event.getGenderRestriction().trim().toLowerCase().equals("mixed"))) {
                        boolean playerIsMale = playerGenderNormalized.equals("male") || playerGenderNormalized.equals("men");
                        boolean partnerIsMale = pGenderNormalized.equals("male") || pGenderNormalized.equals("men");
                        boolean playerIsFemale = playerGenderNormalized.equals("female") || playerGenderNormalized.equals("women");
                        boolean partnerIsFemale = pGenderNormalized.equals("female") || pGenderNormalized.equals("women");
                        
                        if (!((playerIsMale && partnerIsFemale) || (playerIsFemale && partnerIsMale))) {
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                    .body("Mixed doubles requires exactly one male and one female player.");
                        }
                    }
                }
            }
        }

        // 2. Create shadow profile for partner if doubles and email doesn't exist
        if (registration.getPartnerEmail() != null && !registration.getPartnerEmail().trim().isEmpty() &&
            registration.getPartnerName() != null && !registration.getPartnerName().trim().isEmpty()) {
            
            String pEmail = registration.getPartnerEmail().trim();
            if (profileRepository.findByEmail(pEmail.toLowerCase()).isEmpty()) {
                String shadowId = "u-" + java.util.UUID.randomUUID().toString().substring(0, 8);
                Profile shadowProfile = Profile.builder()
                        .id(shadowId)
                        .email(pEmail)
                        .name(registration.getPartnerName().trim())
                        .gender(registration.getPartnerGender())
                        .age(registration.getPartnerAge())
                        .roles(new String[]{"player"})
                        .passwordHash(null) // unclaimed
                        .build();
                profileRepository.save(shadowProfile);
            }
        }

        // 3. Upsert registration: check if player is already registered for this event
        if (registration.getEventId() != null && registration.getPlayerId() != null) {
            java.util.Optional<Registration> existingReg = registrationRepository.findByEventIdAndPlayerId(
                    registration.getEventId(), registration.getPlayerId()
            );
            if (existingReg.isPresent()) {
                Registration current = existingReg.get();
                if (registration.getPlayerName() != null) current.setPlayerName(registration.getPlayerName());
                if (registration.getPlayerEmail() != null) current.setPlayerEmail(registration.getPlayerEmail());
                if (registration.getPartnerName() != null) current.setPartnerName(registration.getPartnerName());
                if (registration.getPartnerEmail() != null) current.setPartnerEmail(registration.getPartnerEmail());
                if (registration.getPartnerGender() != null) current.setPartnerGender(registration.getPartnerGender());
                if (registration.getPartnerAge() != null) current.setPartnerAge(registration.getPartnerAge());
                if (registration.getTournamentId() != null) current.setTournamentId(registration.getTournamentId());
                Registration updated = registrationRepository.save(current);
                return ResponseEntity.ok(updated);
            }
        }

        Registration saved = registrationRepository.save(registration);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Registration> updateRegistration(@PathVariable String id, @RequestBody Registration registration) {
        if (!registrationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        registration.setId(id);
        Registration updated = registrationRepository.save(registration);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRegistration(@PathVariable String id) {
        if (!registrationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        registrationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
