package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "registration_id")
    private String registrationId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(name = "razorpay_order_id", unique = true, nullable = false)
    private String razorpayOrderId;

    @Column(nullable = false)
    private String status; // 'created', 'paid', 'failed'

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
