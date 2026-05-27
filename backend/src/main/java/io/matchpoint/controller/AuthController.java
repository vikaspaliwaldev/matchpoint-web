package io.matchpoint.controller;

import io.matchpoint.dto.AuthRequest;
import io.matchpoint.dto.AuthResponse;
import io.matchpoint.dto.RegisterRequest;
import io.matchpoint.entity.Profile;
import io.matchpoint.entity.UserLogin;
import io.matchpoint.repository.ProfileRepository;
import io.matchpoint.repository.UserLoginRepository;
import io.matchpoint.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final ProfileRepository profileRepository;
    private final UserLoginRepository userLoginRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request, HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");

        Optional<Profile> profileOpt = profileRepository.findByEmail(request.getEmail());

        if (profileOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication failed: User not found");
        }

        Profile profile = profileOpt.get();

        // Check if password hash is present and matches
        if (profile.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), profile.getPasswordHash())) {
            // Log failed login history
            UserLogin failedLog = UserLogin.builder()
                    .userId(profile.getId())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .status("failed_bad_credentials")
                    .build();
            userLoginRepository.save(failedLog);

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication failed: Invalid credentials");
        }

        // Log successful login history
        UserLogin successLog = UserLogin.builder()
                .userId(profile.getId())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .status("success")
                .build();
        userLoginRepository.save(successLog);

        // Generate JWT
        String token = jwtUtil.generateToken(profile.getEmail(), profile.getId(), profile.getRoles());

        AuthResponse response = new AuthResponse(
                token,
                new AuthResponse.UserInfo(profile.getId(), profile.getEmail(), profile.getName(), profile.getRoles())
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (profileRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Profile with this email already exists");
        }

        String userId = "u-" + UUID.randomUUID().toString().substring(0, 8);
        String[] roles = request.getRoles() != null && request.getRoles().length > 0
                ? request.getRoles()
                : new String[]{"player"};

        Profile profile = Profile.builder()
                .id(userId)
                .email(request.getEmail())
                .name(request.getName())
                .phone(request.getPhone())
                .roles(roles)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        profileRepository.save(profile);

        return ResponseEntity.status(HttpStatus.CREATED).body("Registration successful");
    }
}
