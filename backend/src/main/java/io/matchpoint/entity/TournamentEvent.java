package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentEvent {

    @Id
    private String id;

    @Column(name = "tournament_id", nullable = false)
    private String tournamentId;

    @Column(name = "master_event_id", nullable = false)
    private String masterEventId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "master_event_id", insertable = false, updatable = false)
    private EventMaster masterEvent;

    @Column(name = "entry_limit", nullable = false)
    private Integer entryLimit;

    @Column(nullable = false)
    private String format; // 'knockout', 'round_robin', 'swiss', 'league', 'hybrid'

    @Column(name = "scoring_format", nullable = false)
    private String scoringFormat; // '11-point', '15-point', '21-point'

    @Column(name = "sport")
    private String sport = "badminton";

    @Column(name = "registrations_count")
    private Integer registrationsCount;

    @Column(name = "entry_fee")
    private Double entryFee;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // Transient getters to maintain 100% Jackson REST API compatibility with Next.js frontend

    @Transient
    public String getEventName() {
        return masterEvent != null ? masterEvent.getName() : null;
    }

    @Transient
    public String getCategory() {
        return masterEvent != null ? masterEvent.getCategory() : null;
    }

    @Transient
    public String getGenderRestriction() {
        if (masterEvent == null) return "open";
        String g = masterEvent.getGender();
        if ("Male".equalsIgnoreCase(g)) return "men";
        if ("Female".equalsIgnoreCase(g)) return "women";
        if ("Mixed".equalsIgnoreCase(g)) return "mixed";
        return "open";
    }

    @Transient
    public Integer getAgeLimit() {
        if (masterEvent == null) return null;
        if ("junior".equalsIgnoreCase(masterEvent.getCategory())) {
            return masterEvent.getMaxAge();
        }
        if ("veteran".equalsIgnoreCase(masterEvent.getCategory())) {
            return masterEvent.getMinAge();
        }
        return null;
    }

    @Transient
    public String getAgeRestrictionType() {
        if (masterEvent == null) return "max";
        if ("veteran".equalsIgnoreCase(masterEvent.getCategory())) {
            return "min";
        }
        return "max";
    }

    @Transient
    public String getEventType() {
        if (masterEvent == null) return null;
        String et = masterEvent.getEventType();
        if ("team".equalsIgnoreCase(et)) return "TEAM";
        if ("doubles".equalsIgnoreCase(et)) {
            if ("Mixed".equalsIgnoreCase(masterEvent.getGender())) {
                return "MIXED_DOUBLES";
            }
            return "DOUBLES";
        }
        return "SINGLES";
    }

    @Transient
    public String getGender() {
        if (masterEvent == null) return "OPEN";
        String g = masterEvent.getGender();
        String cat = masterEvent.getCategory();
        if ("junior".equalsIgnoreCase(cat)) {
            if ("Male".equalsIgnoreCase(g)) return "BOYS";
            if ("Female".equalsIgnoreCase(g)) return "GIRLS";
            if ("Mixed".equalsIgnoreCase(g)) return "MIXED";
            return "OPEN";
        } else {
            if ("Male".equalsIgnoreCase(g)) return "MALE";
            if ("Female".equalsIgnoreCase(g)) return "FEMALE";
            if ("Mixed".equalsIgnoreCase(g)) return "MIXED";
            return "OPEN";
        }
    }

    @Transient
    public String getAgeCategory() {
        if (masterEvent == null) return "Open";
        String cat = masterEvent.getCategory();
        if ("junior".equalsIgnoreCase(cat)) {
            return "U" + masterEvent.getMaxAge();
        } else if ("veteran".equalsIgnoreCase(cat)) {
            return "Masters " + masterEvent.getMinAge() + "+";
        }
        return "Open";
    }

    @Transient
    public Integer getMinAge() {
        return masterEvent != null ? masterEvent.getMinAge() : null;
    }

    @Transient
    public Integer getMaxAge() {
        return masterEvent != null ? masterEvent.getMaxAge() : null;
    }
}
