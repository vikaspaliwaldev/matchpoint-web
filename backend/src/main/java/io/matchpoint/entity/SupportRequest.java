package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "support_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    private String organization;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String status; // 'open', 'resolved', 'closed'

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
