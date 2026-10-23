package io.matchpoint.repository;

import io.matchpoint.entity.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, UUID> {
    Optional<PaymentOrder> findByRazorpayOrderId(String razorpayOrderId);
    List<PaymentOrder> findByUserId(String userId);
    List<PaymentOrder> findByRegistrationId(String registrationId);
}
