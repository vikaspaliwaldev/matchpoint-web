package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentMedia {

    @Id
    private String id;

    @Column(name = "tournament_id")
    @com.fasterxml.jackson.annotation.JsonProperty("tournament_id")
    private String tournamentId;

    @Column(name = "match_id")
    @com.fasterxml.jackson.annotation.JsonProperty("match_id")
    private String matchId;

    @Column(name = "uploaded_by")
    @com.fasterxml.jackson.annotation.JsonProperty("uploaded_by")
    private String uploadedBy;

    @Column(name = "file_url", nullable = false, columnDefinition = "TEXT")
    @com.fasterxml.jackson.annotation.JsonProperty("file_url")
    private String fileUrl;

    private String caption;

    @Column(name = "media_type")
    @com.fasterxml.jackson.annotation.JsonProperty("media_type")
    @Builder.Default
    private String mediaType = "image";

    @Column(name = "created_at", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("created_at")
    private LocalDateTime createdAt;
}
