package io.matchpoint.service;

import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import io.matchpoint.entity.PaymentOrder;
import io.matchpoint.entity.PaymentTransaction;
import io.matchpoint.entity.Registration;
import io.matchpoint.entity.Tournament;
import io.matchpoint.entity.TournamentEvent;
import io.matchpoint.repository.PaymentOrderRepository;
import io.matchpoint.repository.PaymentTransactionRepository;
import io.matchpoint.repository.RegistrationRepository;
import io.matchpoint.repository.TournamentEventRepository;
import io.matchpoint.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Element;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class RazorpayService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RegistrationRepository registrationRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentEventRepository tournamentEventRepository;

    @Value("${razorpay.key-id:rzp_test_mockKeyId}")
    private String keyId;

    @Value("${razorpay.key-secret:mockKeySecret}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:mockWebhookSecret}")
    private String webhookSecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() {
        try {
            if (isMockMode()) {
                log.warn("⚠️ Razorpay is running in MOCK mode. Configure real key-id/key-secret to connect to Razorpay.");
            } else {
                this.razorpayClient = new RazorpayClient(keyId, keySecret);
                log.info("💳 Razorpay initialized successfully.");
            }
        } catch (Exception e) {
            log.error("❌ Failed to initialize RazorpayClient: ", e);
        }
    }

    public boolean isMockMode() {
        return keyId == null || keyId.trim().isEmpty() || keyId.startsWith("rzp_test_mock") || keyId.equals("mock") || 
               keySecret == null || keySecret.trim().isEmpty() || keySecret.equals("mock");
    }

    public String getKeyId() {
        return keyId;
    }

    /**
     * Creates a Razorpay payment order for tournament registration
     */
    @Transactional
    public PaymentOrder createOrder(String registrationId, String userId) throws Exception {
        log.info("💳 Creating Razorpay payment order for registration: {}, user: {}", registrationId, userId);
        
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        
        Tournament tournament = tournamentRepository.findById(registration.getTournamentId())
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        
        TournamentEvent event = tournamentEventRepository.findById(registration.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Tournament event not found"));

        BigDecimal fee = event.getEntryFee() != null ? BigDecimal.valueOf(event.getEntryFee()) : null;
        if (fee == null || fee.compareTo(BigDecimal.ZERO) <= 0) {
            fee = tournament.getEntryFee();
        }

        if (fee == null || fee.compareTo(BigDecimal.ZERO) <= 0) {
            // Free tournament / event, auto approve registration
            registration.setPaymentStatus("exempt");
            registration.setStatus("approved");
            registrationRepository.save(registration);
            log.info("💸 Registration is free, marked as exempt and approved automatically.");
            return null;
        }

        long amountInPaise = fee.multiply(BigDecimal.valueOf(100)).longValue();
        String currency = tournament.getCurrency() != null ? tournament.getCurrency().toUpperCase() : "INR";
        
        String razorpayOrderId;
        if (isMockMode()) {
            razorpayOrderId = "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            log.info("💰 [MOCK] Generated mock order ID: {}", razorpayOrderId);
        } else {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", registrationId);
            
            JSONObject notes = new JSONObject();
            notes.put("registration_id", registrationId);
            notes.put("user_id", userId);
            orderRequest.put("notes", notes);
            
            com.razorpay.Order order = razorpayClient.orders.create(orderRequest);
            razorpayOrderId = order.get("id");
            log.info("✅ Razorpay Order created: {}", razorpayOrderId);
        }

        PaymentOrder paymentOrder = PaymentOrder.builder()
                .userId(userId)
                .registrationId(registrationId)
                .amount(fee)
                .currency(currency)
                .razorpayOrderId(razorpayOrderId)
                .status("created")
                .build();
                
        PaymentOrder saved = paymentOrderRepository.save(paymentOrder);
        
        registration.setPaymentStatus("pending");
        registrationRepository.save(registration);
        
        return saved;
    }

    /**
     * Verifies payment signatures submitted from client success callbacks
     */
    @Transactional
    public boolean verifyPayment(String orderId, String paymentId, String signature) {
        log.info("💳 Verifying payment signature for Order: {}, Payment: {}", orderId, paymentId);
        
        PaymentOrder paymentOrder = paymentOrderRepository.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Payment order not found for Razorpay Order ID: " + orderId));
                
        boolean isValid = false;
        if (isMockMode()) {
            isValid = signature != null && signature.startsWith("mock_sig");
            log.info("💰 [MOCK] Signature verification result: {}", isValid);
        } else {
            try {
                JSONObject attributes = new JSONObject();
                attributes.put("razorpay_order_id", orderId);
                attributes.put("razorpay_payment_id", paymentId);
                attributes.put("razorpay_signature", signature);
                
                isValid = Utils.verifyPaymentSignature(attributes, keySecret);
                log.info("✅ Signature verification result: {}", isValid);
            } catch (Exception e) {
                log.error("❌ Razorpay signature verification exception: ", e);
            }
        }
        
        if (isValid) {
            paymentOrder.setStatus("paid");
            paymentOrderRepository.save(paymentOrder);
            
            Optional<PaymentTransaction> existingTx = paymentTransactionRepository.findByRazorpayPaymentId(paymentId);
            if (existingTx.isEmpty()) {
                PaymentTransaction tx = PaymentTransaction.builder()
                        .orderId(paymentOrder.getId())
                        .razorpayPaymentId(paymentId)
                        .paymentMethod("razorpay")
                        .status("success")
                        .build();
                paymentTransactionRepository.save(tx);
            }
            
            Registration registration = registrationRepository.findById(paymentOrder.getRegistrationId()).orElse(null);
            if (registration != null) {
                registration.setPaymentStatus("paid");
                registration.setStatus("approved");
                registration.setPaymentMethod("razorpay");
                registrationRepository.save(registration);
                log.info("✅ Registration {} confirmed successfully.", registration.getId());
            }
            return true;
        } else {
            paymentOrder.setStatus("failed");
            paymentOrderRepository.save(paymentOrder);
            return false;
        }
    }

    /**
     * Handles webhook payloads from Razorpay
     */
    @Transactional
    public void processWebhook(String payload, String signatureHeader) throws Exception {
        log.info("💳 Processing Razorpay Webhook Event...");
        
        if (isMockMode()) {
            log.warn("⚠️ Razorpay webhook running in MOCK mode. Webhook signature validation skipped!");
            handleWebhookPayload(payload);
            return;
        }
        
        boolean isValid = false;
        try {
            isValid = Utils.verifyWebhookSignature(payload, signatureHeader, webhookSecret);
        } catch (Exception e) {
            log.error("❌ Webhook signature verification failed: ", e);
        }
        
        if (!isValid) {
            throw new SecurityException("Invalid webhook signature");
        }
        
        handleWebhookPayload(payload);
    }

    @SuppressWarnings("unchecked")
    private void handleWebhookPayload(String payload) throws Exception {
        org.springframework.boot.json.JsonParser parser = org.springframework.boot.json.JsonParserFactory.getJsonParser();
        java.util.Map<String, Object> map = parser.parseMap(payload);
        
        String event = (String) map.get("event");
        log.info("✅ Razorpay Webhook Validated. Event type: {}", event);
        
        java.util.Map<String, Object> payloadMap = (java.util.Map<String, Object>) map.get("payload");
        if (payloadMap == null) return;
        
        String razorpayOrderId = null;
        String razorpayPaymentId = null;
        String paymentMethod = "razorpay";
        
        if ("order.paid".equals(event)) {
            java.util.Map<String, Object> orderContainer = (java.util.Map<String, Object>) payloadMap.get("order");
            if (orderContainer != null) {
                java.util.Map<String, Object> orderEntity = (java.util.Map<String, Object>) orderContainer.get("entity");
                if (orderEntity != null) {
                    razorpayOrderId = (String) orderEntity.get("id");
                }
            }
            java.util.Map<String, Object> paymentContainer = (java.util.Map<String, Object>) payloadMap.get("payment");
            if (paymentContainer != null) {
                java.util.Map<String, Object> paymentEntity = (java.util.Map<String, Object>) paymentContainer.get("entity");
                if (paymentEntity != null) {
                    razorpayPaymentId = (String) paymentEntity.get("id");
                    paymentMethod = (String) paymentEntity.get("method");
                }
            }
        } else if ("payment.captured".equals(event) || "payment.authorized".equals(event)) {
            java.util.Map<String, Object> paymentContainer = (java.util.Map<String, Object>) payloadMap.get("payment");
            if (paymentContainer != null) {
                java.util.Map<String, Object> paymentEntity = (java.util.Map<String, Object>) paymentContainer.get("entity");
                if (paymentEntity != null) {
                    razorpayPaymentId = (String) paymentEntity.get("id");
                    razorpayOrderId = (String) paymentEntity.get("order_id");
                    paymentMethod = (String) paymentEntity.get("method");
                }
            }
        } else if ("payment.failed".equals(event)) {
            java.util.Map<String, Object> paymentContainer = (java.util.Map<String, Object>) payloadMap.get("payment");
            if (paymentContainer != null) {
                java.util.Map<String, Object> paymentEntity = (java.util.Map<String, Object>) paymentContainer.get("entity");
                if (paymentEntity != null) {
                    razorpayOrderId = (String) paymentEntity.get("order_id");
                }
            }
            if (razorpayOrderId != null) {
                Optional<PaymentOrder> orderOpt = paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId);
                if (orderOpt.isPresent()) {
                    PaymentOrder pOrder = orderOpt.get();
                    pOrder.setStatus("failed");
                    paymentOrderRepository.save(pOrder);
                    
                    Registration registration = registrationRepository.findById(pOrder.getRegistrationId()).orElse(null);
                    if (registration != null) {
                        registration.setPaymentStatus("failed");
                        registrationRepository.save(registration);
                    }
                }
            }
            return;
        }
        
        if (razorpayOrderId == null) {
            log.warn("⚠️ Webhook event {} processed but no Razorpay Order ID found.", event);
            return;
        }
        
        Optional<PaymentOrder> orderOpt = paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId);
        if (orderOpt.isEmpty()) {
            log.warn("⚠️ Webhook order {} not found in local database", razorpayOrderId);
            return;
        }
        
        PaymentOrder pOrder = orderOpt.get();
        
        if ("order.paid".equals(event) || "payment.captured".equals(event)) {
            pOrder.setStatus("paid");
            paymentOrderRepository.save(pOrder);
            
            if (razorpayPaymentId != null) {
                Optional<PaymentTransaction> existingTx = paymentTransactionRepository.findByRazorpayPaymentId(razorpayPaymentId);
                if (existingTx.isEmpty()) {
                    PaymentTransaction tx = PaymentTransaction.builder()
                            .orderId(pOrder.getId())
                            .razorpayPaymentId(razorpayPaymentId)
                            .paymentMethod(paymentMethod)
                            .status("success")
                            .build();
                    paymentTransactionRepository.save(tx);
                }
            }
            
            Registration registration = registrationRepository.findById(pOrder.getRegistrationId()).orElse(null);
            if (registration != null) {
                registration.setPaymentStatus("paid");
                registration.setStatus("approved");
                registration.setPaymentMethod("razorpay");
                registrationRepository.save(registration);
                log.info("✅ [Webhook] Registration {} confirmed successfully.", registration.getId());
            }
        }
    }

    /**
     * Generates a PDF byte array representing the fee collection report for a tournament
     */
    public byte[] generateFeeReportPdf(String tournamentId) throws Exception {
        log.info("📄 Generating PDF Fee Collection Report for Tournament ID: {}", tournamentId);
        
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found"));
        
        List<Registration> registrations = registrationRepository.findByTournamentId(tournamentId);
        
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, baos);
        
        document.open();
        
        // Setup fonts
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, new java.awt.Color(79, 70, 229));
        Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, java.awt.Color.DARK_GRAY);
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, java.awt.Color.BLACK);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, java.awt.Color.BLACK);
        Font summaryFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new java.awt.Color(31, 41, 55));
        
        // Report Title
        Paragraph title = new Paragraph("MatchPoint Fee Collection Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(4);
        document.add(title);
        
        // Subtitle - Tournament Name
        Paragraph subtitle = new Paragraph("Tournament: " + tournament.getName(), subtitleFont);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(10);
        document.add(subtitle);
        
        // Meta Information
        Paragraph meta = new Paragraph(
                "Location: " + tournament.getLocation() + "   |   Dates: " + tournament.getStartDate() + " to " + tournament.getEndDate(),
                normalFont
        );
        meta.setAlignment(Element.ALIGN_CENTER);
        meta.setSpacingAfter(24);
        document.add(meta);
        
        // Calculate Statistics
        BigDecimal totalCollected = BigDecimal.ZERO;
        BigDecimal totalPending = BigDecimal.ZERO;
        int paidCount = 0;
        int pendingCount = 0;
        
        // Registrations Table
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        table.setWidths(new float[]{2.2f, 2.3f, 1.3f, 1.2f, 1.2f, 1.8f});
        
        // Add headers
        String[] headers = {"Player Name", "Player Email", "Event ID", "Entry Fee", "Payment Status", "Razorpay Order ID"};
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Paragraph(header, labelFont));
            cell.setBackgroundColor(new java.awt.Color(243, 244, 246));
            cell.setPadding(8);
            cell.setHorizontalAlignment(Element.ALIGN_LEFT);
            table.addCell(cell);
        }
        
        for (Registration reg : registrations) {
            // Determine entry fee for registration
            Optional<TournamentEvent> eventOpt = tournamentEventRepository.findById(reg.getEventId());
            BigDecimal fee = BigDecimal.ZERO;
            if (eventOpt.isPresent() && eventOpt.get().getEntryFee() != null) {
                fee = BigDecimal.valueOf(eventOpt.get().getEntryFee());
            }
            if (fee == null || fee.compareTo(BigDecimal.ZERO) <= 0) {
                fee = tournament.getEntryFee();
            }
            if (fee == null) {
                fee = BigDecimal.ZERO;
            }
            
            // Resolve payment details from payment_orders
            List<PaymentOrder> orders = paymentOrderRepository.findByRegistrationId(reg.getId());
            String orderIdStr = "N/A";
            String payStatusStr = reg.getPaymentStatus();
            
            if (!orders.isEmpty()) {
                PaymentOrder order = orders.get(orders.size() - 1);
                fee = order.getAmount();
                orderIdStr = order.getRazorpayOrderId();
                payStatusStr = order.getStatus();
            }
            
            if (payStatusStr == null) {
                payStatusStr = "unpaid";
            }
            
            if ("paid".equalsIgnoreCase(payStatusStr)) {
                totalCollected = totalCollected.add(fee);
                paidCount++;
            } else {
                totalPending = totalPending.add(fee);
                pendingCount++;
            }
            
            table.addCell(new PdfPCell(new Paragraph(reg.getPlayerName(), normalFont)));
            table.addCell(new PdfPCell(new Paragraph(reg.getPlayerEmail(), normalFont)));
            
            String eventName = eventOpt.isPresent() && eventOpt.get().getMasterEventId() != null ? 
                               eventOpt.get().getMasterEventId().toUpperCase() : reg.getEventId();
            table.addCell(new PdfPCell(new Paragraph(eventName, normalFont)));
            
            table.addCell(new PdfPCell(new Paragraph(tournament.getCurrency() + " " + fee, normalFont)));
            table.addCell(new PdfPCell(new Paragraph(payStatusStr.toUpperCase(), normalFont)));
            table.addCell(new PdfPCell(new Paragraph(orderIdStr, normalFont)));
        }
        
        // Summary Block
        Paragraph summaryTitle = new Paragraph("Financial Summary", subtitleFont);
        summaryTitle.setSpacingBefore(12);
        summaryTitle.setSpacingAfter(8);
        document.add(summaryTitle);
        
        Paragraph summaryText = new Paragraph(
                "Total Registrations: " + registrations.size() + "\n" +
                "Completed Payments: " + paidCount + "\n" +
                "Pending/Failed Payments: " + pendingCount + "\n\n" +
                "Total Revenue Collected: " + tournament.getCurrency() + " " + totalCollected + "\n" +
                "Projected Outstanding Revenue: " + tournament.getCurrency() + " " + totalPending,
                summaryFont
        );
        summaryText.setSpacingAfter(18);
        document.add(summaryText);
        
        // Add detailed transactions table
        document.add(table);
        
        document.close();
        return baos.toByteArray();
    }
}
