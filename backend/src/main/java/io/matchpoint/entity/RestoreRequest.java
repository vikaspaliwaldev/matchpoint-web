package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "database_restore_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestoreRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "backup_data", nullable = false, columnDefinition = "TEXT")
    private String backupData;

    @Column(name = "requested_by", nullable = false)
    private String requestedBy;

    @Column(name = "approved_by")
    private String approvedBy; // Username of the second Admin who approved and executed it

    @Column(nullable = false)
    private String status; // 'PENDING', 'EXECUTED', 'REJECTED'

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
