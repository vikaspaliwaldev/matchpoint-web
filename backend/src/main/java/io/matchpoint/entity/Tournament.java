package io.matchpoint.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "tournaments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tournament {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String location;
    private String banner;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    private String type; // 'individual', 'team'

    @Column(nullable = false)
    private String status; // 'draft', 'open', 'live', 'completed', 'cancelled'

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "team_size_limit")
    private Integer teamSizeLimit;

    @Column(name = "team_tie_events", columnDefinition = "text[]")
    private String[] teamTieEvents;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "team_tie_configs", columnDefinition = "jsonb")
    private List<TeamTieConfig> teamTieConfigs;

    @Column(name = "bonus_point_margin")
    private Integer bonusPointMargin;

    @Column(name = "bonus_point_value")
    private Integer bonusPointValue;

    @Column(name = "age_cutoff_date")
    private LocalDate ageCutoffDate;

    @Column(name = "withdraw_date")
    private LocalDate withdrawDate;

    @Column(name = "admins", columnDefinition = "text[]")
    private String[] admins;

    @Column(name = "collects_fees")
    private Boolean collectsFees = false;

    @Column(name = "entry_fee")
    private java.math.BigDecimal entryFee = java.math.BigDecimal.ZERO;

    private String currency = "INR";

    @Column(name = "sport")
    private String sport = "badminton";

    @Column(name = "platform_fee_percentage")
    private java.math.BigDecimal platformFeePercentage = java.math.BigDecimal.valueOf(2.00);

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payment_options", columnDefinition = "jsonb")
    private List<PaymentOption> paymentOptions;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentOption {
        private String provider;
        private Boolean enabled;
        private java.util.Map<String, String> details;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamTieConfig {
        private String event_id;
        private String name;
        private int count;
    }
}
