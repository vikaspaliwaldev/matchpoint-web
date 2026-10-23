package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Registration {

    @Id
    private String id;

    @Column(name = "tournament_id", nullable = false)
    private String tournamentId;

    @Column(name = "event_id", nullable = false)
    private String eventId;

    @Column(name = "player_id", nullable = false)
    private String playerId;

    @Column(name = "player_name", nullable = false)
    private String playerName;

    @Column(name = "player_email", nullable = false)
    private String playerEmail;

    @Column(nullable = false)
    private String status; // 'pending', 'approved', 'rejected', 'waitlisted', 'disqualified'

    @Column(name = "disqualification_reason", columnDefinition = "TEXT")
    private String disqualificationReason;

    @Column(name = "registered_at", insertable = false, updatable = false)
    private LocalDateTime registeredAt;

    private Integer seed;

    @Column(name = "payment_status")
    private String paymentStatus = "unpaid"; // 'unpaid', 'pending', 'paid', 'refunded', 'exempt'

    @Column(name = "payment_method")
    private String paymentMethod = "stripe"; // 'stripe', 'offline'

    @Column(name = "partner_name")
    private String partnerName;

    @Column(name = "partner_email")
    private String partnerEmail;

    @Column(name = "partner_gender")
    private String partnerGender;

    @Column(name = "partner_age")
    private Integer partnerAge;
}
