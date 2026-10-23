package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "match_polls")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchPoll {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.UUID)
    private UUID id;

    @Column(name = "match_id", nullable = false)
    private String matchId;

    @Column(nullable = false)
    private String question;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", columnDefinition = "jsonb")
    private List<String> options;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "votes", columnDefinition = "jsonb")
    private List<Integer> votes;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
