package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "razorpay_payment_id", unique = true, nullable = false)
    private String razorpayPaymentId;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(nullable = false)
    private String status; // 'success', 'failed'

    @Column(name = "paid_at", insertable = false, updatable = false)
    private LocalDateTime paidAt;
}
