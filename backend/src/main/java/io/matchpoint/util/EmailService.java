package io.matchpoint.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        log.info("📧 Attempting to send OTP email to {} with code: {}", toEmail, otp);
        if (mailSender == null) {
            log.warn("⚠️ JavaMailSender is not configured. Falling back to Mock Mail.");
            logMockEmail(toEmail, otp);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("MatchPoint Password Recovery OTP");
            message.setText("Hello,\n\n"
                    + "You requested a password reset for your MatchPoint account.\n"
                    + "Your 6-digit verification code (OTP) is:\n\n"
                    + "   " + otp + "\n\n"
                    + "This code will expire in 5 minutes. If you did not request this reset, please ignore this email.\n\n"
                    + "Best regards,\n"
                    + "The MatchPoint Team");
            mailSender.send(message);
            log.info("✅ OTP Email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.warn("⚠️ Failed to send email via SMTP: {}. Logging OTP locally.", e.getMessage());
            logMockEmail(toEmail, otp);
        }
    }

    public void sendFeeReportEmail(String toEmail, String tournamentName, byte[] pdfBytes) {
        log.info("📧 Attempting to send fee report email for tournament: {} to {}", tournamentName, toEmail);
        if (mailSender == null) {
            log.warn("⚠️ JavaMailSender is not configured. Logging report email details locally.");
            logMockReportEmail(toEmail, tournamentName, pdfBytes.length);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(toEmail);
            helper.setSubject("MatchPoint Fee Collection Report: " + tournamentName);
            helper.setText("Hello,\n\n"
                    + "Please find attached the official Fee Collection Report for the tournament: \"" + tournamentName + "\".\n\n"
                    + "Best regards,\n"
                    + "The MatchPoint Team");
            
            String filename = "Fee_Collection_Report_" + tournamentName.replaceAll("\\s+", "_") + ".pdf";
            helper.addAttachment(filename, new ByteArrayResource(pdfBytes));

            mailSender.send(message);
            log.info("✅ Fee Report Email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Failed to send fee report email: {}", e.getMessage(), e);
        }
    }

    private void logMockEmail(String toEmail, String otp) {
        log.info("================================================");
        log.info("🔥 [MOCK MAIL] OTP for {} is: {}", toEmail, otp);
        log.info("================================================");
    }

    private void logMockReportEmail(String toEmail, String tournamentName, int size) {
        log.info("================================================");
        log.info("🔥 [MOCK MAIL] Fee Report for tournament '{}' would be sent to {} (Size: {} bytes)", tournamentName, toEmail, size);
        log.info("================================================");
    }
}
