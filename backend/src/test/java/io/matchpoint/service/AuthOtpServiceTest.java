package io.matchpoint.service;

import io.matchpoint.entity.PasswordReset;
import io.matchpoint.entity.Profile;
import io.matchpoint.repository.PasswordResetRepository;
import io.matchpoint.repository.ProfileRepository;
import io.matchpoint.util.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class AuthOtpServiceTest {

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private PasswordResetRepository passwordResetRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthOtpService authOtpService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testRequestPasswordReset_Success() {
        String email = "player@matchpoint.io";
        Profile mockProfile = Profile.builder().id("u1").email(email).name("Test Player").build();
        
        when(profileRepository.findByEmail(email)).thenReturn(Optional.of(mockProfile));

        authOtpService.requestPasswordReset(email);

        verify(passwordResetRepository, times(1)).save(any(PasswordReset.class));
        verify(emailService, times(1)).sendOtpEmail(eq(email), anyString());
    }

    @Test
    public void testRequestPasswordReset_NonExistentEmail() {
        String email = "unknown@matchpoint.io";
        when(profileRepository.findByEmail(email)).thenReturn(Optional.empty());

        authOtpService.requestPasswordReset(email);

        verify(passwordResetRepository, never()).save(any(PasswordReset.class));
        verify(emailService, never()).sendOtpEmail(anyString(), anyString());
    }

    @Test
    public void testVerifyOtp_Success() {
        String email = "player@matchpoint.io";
        String otp = "123456";
        
        // Hashed equivalent of "123456" via SHA-256 is "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
        String otpHash = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
        
        PasswordReset resetRecord = PasswordReset.builder()
                .email(email)
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .isVerified(false)
                .build();

        when(passwordResetRepository.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(resetRecord));

        Optional<String> tokenOpt = authOtpService.verifyOtp(email, otp);

        assertTrue(tokenOpt.isPresent());
        assertTrue(resetRecord.isVerified());
        assertNotNull(resetRecord.getResetToken());
        verify(passwordResetRepository, times(1)).save(resetRecord);
    }

    @Test
    public void testVerifyOtp_Failure_Expired() {
        String email = "player@matchpoint.io";
        PasswordReset resetRecord = PasswordReset.builder()
                .email(email)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .attempts(0)
                .isVerified(false)
                .build();

        when(passwordResetRepository.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(resetRecord));

        Optional<String> tokenOpt = authOtpService.verifyOtp(email, "123456");

        assertFalse(tokenOpt.isPresent());
        verify(passwordResetRepository, never()).save(any(PasswordReset.class));
    }

    @Test
    public void testVerifyOtp_Failure_TooManyAttempts() {
        String email = "player@matchpoint.io";
        PasswordReset resetRecord = PasswordReset.builder()
                .email(email)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(3)
                .isVerified(false)
                .build();

        when(passwordResetRepository.findTopByEmailOrderByCreatedAtDesc(email)).thenReturn(Optional.of(resetRecord));

        Optional<String> tokenOpt = authOtpService.verifyOtp(email, "123456");

        assertFalse(tokenOpt.isPresent());
    }

    @Test
    public void testResetPassword_Success() {
        String resetToken = "valid-token";
        String newPassword = "new-secure-password";
        String email = "player@matchpoint.io";

        PasswordReset resetRecord = PasswordReset.builder()
                .email(email)
                .resetToken(resetToken)
                .isVerified(true)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        Profile mockProfile = Profile.builder().id("u1").email(email).name("Test Player").build();

        when(passwordResetRepository.findByResetToken(resetToken)).thenReturn(Optional.of(resetRecord));
        when(profileRepository.findByEmail(email)).thenReturn(Optional.of(mockProfile));
        when(passwordEncoder.encode(newPassword)).thenReturn("encoded-password-hash");

        boolean result = authOtpService.resetPassword(resetToken, newPassword);

        assertTrue(result);
        assertEquals("encoded-password-hash", mockProfile.getPasswordHash());
        assertNull(resetRecord.getResetToken());
        verify(profileRepository, times(1)).save(mockProfile);
        verify(passwordResetRepository, times(1)).save(resetRecord);
    }
}
