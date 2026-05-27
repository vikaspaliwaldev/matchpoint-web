package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "tournament_id", nullable = false)
    private String tournamentId;

    @Column(name = "logo_color", nullable = false)
    private String logoColor;

    @Column(name = "captain_id")
    private String captainId;

    // Maps PostgreSQL TEXT[] natively in Hibernate 6
    @Column(name = "players", columnDefinition = "text[]")
    private String[] players;
}
