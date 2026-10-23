package io.matchpoint.controller;

import io.matchpoint.repository.TournamentRepository;
import io.matchpoint.service.RazorpayService;
import io.matchpoint.util.EmailService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@Slf4j
@RequiredArgsConstructor
public class PaymentController {

    private final RazorpayService razorpayService;
    private final EmailService emailService;
    private final TournamentRepository tournamentRepository;

    // --- Razorpay Endpoints ---
    @GetMapping("/api/v1/public/payments/razorpay/config")
    public ResponseEntity<?> getRazorpayConfig() {
        return ResponseEntity.ok(java.util.Map.of(
            "razorpay_key_id", razorpayService.getKeyId(),
            "is_mock", razorpayService.isMockMode()
        ));
    }

    @PostMapping("/api/v1/payments/razorpay/order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody RazorpayOrderRequest request) {
        try {
            String userId = request.getUserId();
            if (userId == null || userId.isEmpty()) {
                userId = "anonymous";
            }
            io.matchpoint.entity.PaymentOrder order = razorpayService.createOrder(request.getRegistrationId(), userId);
            if (order == null) {
                return ResponseEntity.ok(java.util.Map.of("free", true));
            }
            return ResponseEntity.ok(java.util.Map.of(
                "id", order.getRazorpayOrderId(),
                "amount", order.getAmount(),
                "currency", order.getCurrency(),
                "free", false
            ));
        } catch (Exception e) {
            log.error("Error creating Razorpay Order", e);
            return ResponseEntity.badRequest().body("Failed to create Razorpay Order: " + e.getMessage());
        }
    }

    @PostMapping("/api/v1/payments/razorpay/verify")
    public ResponseEntity<?> verifyRazorpayPayment(@RequestBody RazorpayVerificationRequest request) {
        try {
            boolean success = razorpayService.verifyPayment(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
            );
            if (success) {
                return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Payment verified successfully"));
            } else {
                return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", "Payment verification failed"));
            }
        } catch (Exception e) {
            log.error("Error verifying Razorpay payment", e);
            return ResponseEntity.badRequest().body("Verification failed: " + e.getMessage());
        }
    }

    @PostMapping("/api/v1/public/payments/razorpay/webhook")
    public ResponseEntity<?> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String sigHeader) {
        try {
            razorpayService.processWebhook(payload, sigHeader);
            return ResponseEntity.ok("Webhook processed successfully");
        } catch (Exception e) {
            log.error("Razorpay Webhook processing error", e);
            return ResponseEntity.badRequest().body("Webhook error: " + e.getMessage());
        }
    }

    // --- Fee Collection Reporting Endpoints ---
    @GetMapping("/api/v1/tournaments/{tournamentId}/payments/report")
    public ResponseEntity<byte[]> getFeeCollectionReport(@PathVariable String tournamentId) {
        try {
            byte[] pdfBytes = razorpayService.generateFeeReportPdf(tournamentId);
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "Fee_Report_" + tournamentId + ".pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error generating fee collection report PDF", e);
            return new ResponseEntity<>(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/api/v1/tournaments/{tournamentId}/payments/report/email")
    public ResponseEntity<?> emailFeeCollectionReport(
            @PathVariable String tournamentId,
            @RequestParam("email") String email) {
        try {
            byte[] pdfBytes = razorpayService.generateFeeReportPdf(tournamentId);
            Optional<io.matchpoint.entity.Tournament> tourOpt = tournamentRepository.findById(tournamentId);
            String tournamentName = tourOpt.map(io.matchpoint.entity.Tournament::getName).orElse(tournamentId);
            
            emailService.sendFeeReportEmail(email, tournamentName, pdfBytes);
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Fee collection report emailed to " + email));
        } catch (Exception e) {
            log.error("Error emailing fee collection report", e);
            return ResponseEntity.badRequest().body("Failed to email report: " + e.getMessage());
        }
    }

    // --- Request DTOs ---
    @Data
    public static class RazorpayOrderRequest {
        private String registrationId;
        private String userId;
    }

    @Data
    public static class RazorpayVerificationRequest {
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
    }
}
