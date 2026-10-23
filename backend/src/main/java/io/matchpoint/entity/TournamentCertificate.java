package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_certificates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentCertificate {

    @Id
    private String id;

    @Column(name = "tournament_id", unique = true, nullable = false)
    private String tournamentId;

    @Column(nullable = false)
    private String title;

    @Column(name = "template_type")
    private String templateType; // 'classic', 'modern', 'glowing'

    @Column(name = "signature_data", columnDefinition = "TEXT")
    private String signatureData; // Base64 signature image

    @Column(name = "border_color")
    private String borderColor;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
