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

import io.matchpoint.dto.ForgotPasswordRequest;
import io.matchpoint.dto.VerifyOtpRequest;
import io.matchpoint.dto.ResetPasswordRequest;
import io.matchpoint.service.AuthOtpService;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final ProfileRepository profileRepository;
    private final UserLoginRepository userLoginRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthOtpService authOtpService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authOtpService.requestPasswordReset(request.getEmail());
        // Return 200 OK regardless of whether email exists to prevent user enumeration
        return ResponseEntity.ok("If the email is registered, a password reset OTP has been sent.");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        Optional<String> resetTokenOpt = authOtpService.verifyOtp(request.getEmail(), request.getOtp());
        if (resetTokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Verification failed: Invalid or expired OTP");
        }
        return ResponseEntity.ok(java.util.Map.of("reset_token", resetTokenOpt.get()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean success = authOtpService.resetPassword(request.getResetToken(), request.getNewPassword());
        if (!success) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Password reset failed: Invalid, expired, or already used reset token");
        }
        return ResponseEntity.ok("Password has been reset successfully.");
    }

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
                    .status("failed_credentials")
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
        Optional<Profile> existingOpt = profileRepository.findByEmail(request.getEmail());
        if (existingOpt.isPresent()) {
            Profile existing = existingOpt.get();
            if (existing.getPasswordHash() != null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Profile with this email already exists");
            } else {
                // Claim shadow profile! Update name, encode password, keep roles (or default to player)
                existing.setName(request.getName());
                existing.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                if (existing.getRoles() == null || existing.getRoles().length == 0) {
                    existing.setRoles(new String[]{"player"});
                }
                profileRepository.save(existing);
                return ResponseEntity.status(HttpStatus.CREATED).body("Registration successful");
            }
        }

        String userId = "u-" + UUID.randomUUID().toString().substring(0, 8);

        // Always default to 'player' role — admin can change roles later
        String[] roles = new String[]{"player"};

        Profile profile = Profile.builder()
                .id(userId)
                .email(request.getEmail())
                .name(request.getName())
                .roles(roles)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        profileRepository.save(profile);

        return ResponseEntity.status(HttpStatus.CREATED).body("Registration successful");
    }

    @GetMapping("/admin/logins")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> getAllUserLogins() {
        return ResponseEntity.ok(userLoginRepository.findAllByOrderByLoginTimeDesc());
    }
}
