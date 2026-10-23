package io.matchpoint.service;

import io.matchpoint.entity.PasswordReset;
import io.matchpoint.entity.Profile;
import io.matchpoint.repository.PasswordResetRepository;
import io.matchpoint.repository.ProfileRepository;
import io.matchpoint.util.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthOtpService {

    private final ProfileRepository profileRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void requestPasswordReset(String email) {
        log.info("🔑 Requesting password reset for email: {}", email);
        Optional<Profile> profileOpt = profileRepository.findByEmail(email);

        if (profileOpt.isEmpty()) {
            log.warn("⚠️ Forgot password requested for non-existent email: {}", email);
            // Return early to prevent email enumeration, pretending we sent it
            return;
        }

        // Generate 6-digit OTP code
        int otpCode = 100000 + secureRandom.nextInt(900000);
        String otpStr = String.valueOf(otpCode);
        String otpHash = sha256Hex(otpStr);

        PasswordReset passwordReset = PasswordReset.builder()
                .email(email)
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .isVerified(false)
                .build();

        passwordResetRepository.save(passwordReset);

        // Send Email
        emailService.sendOtpEmail(email, otpStr);
    }

    @Transactional
    public Optional<String> verifyOtp(String email, String otp) {
        log.info("🔑 Verifying OTP for email: {}", email);
        Optional<PasswordReset> resetOpt = passwordResetRepository.findTopByEmailOrderByCreatedAtDesc(email);

        if (resetOpt.isEmpty()) {
            log.warn("❌ No reset record found for email: {}", email);
            return Optional.empty();
        }

        PasswordReset reset = resetOpt.get();

        if (reset.isVerified()) {
            log.warn("❌ OTP already verified/used for email: {}", email);
            return Optional.empty();
        }

        if (reset.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("❌ OTP expired for email: {}", email);
            return Optional.empty();
        }

        if (reset.getAttempts() >= 3) {
            log.warn("❌ Too many invalid OTP attempts for email: {}", email);
            return Optional.empty();
        }

        String providedHash = sha256Hex(otp);
        if (!reset.getOtpHash().equals(providedHash)) {
            reset.setAttempts(reset.getAttempts() + 1);
            passwordResetRepository.save(reset);
            log.warn("❌ OTP mismatch for email: {}. New attempts: {}", email, reset.getAttempts());
            return Optional.empty();
        }

        // Generate short-lived reset token
        String resetToken = UUID.randomUUID().toString();
        reset.setVerified(true);
        reset.setResetToken(resetToken);
        passwordResetRepository.save(reset);

        log.info("✅ OTP verified successfully. Generated reset token for email: {}", email);
        return Optional.of(resetToken);
    }

    @Transactional
    public boolean resetPassword(String resetToken, String newPassword) {
        log.info("🔑 Resetting password using token...");
        Optional<PasswordReset> resetOpt = passwordResetRepository.findByResetToken(resetToken);

        if (resetOpt.isEmpty()) {
            log.warn("❌ Invalid or non-existent password reset token");
            return false;
        }

        PasswordReset reset = resetOpt.get();

        if (!reset.isVerified()) {
            log.warn("❌ Password reset attempted with unverified token for email: {}", reset.getEmail());
            return false;
        }

        if (reset.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("❌ Password reset attempted with expired token for email: {}", reset.getEmail());
            return false;
        }

        Optional<Profile> profileOpt = profileRepository.findByEmail(reset.getEmail());
        if (profileOpt.isEmpty()) {
            log.warn("❌ User profile not found for email: {}", reset.getEmail());
            return false;
        }

        Profile profile = profileOpt.get();
        profile.setPasswordHash(passwordEncoder.encode(newPassword));
        profileRepository.save(profile);

        // Invalidate the token to prevent re-use
        reset.setResetToken(null);
        passwordResetRepository.save(reset);

        log.info("✅ Password reset successfully for email: {}", profile.getEmail());
        return true;
    }

    private String sha256Hex(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hashing failed", e);
        }
    }
}
