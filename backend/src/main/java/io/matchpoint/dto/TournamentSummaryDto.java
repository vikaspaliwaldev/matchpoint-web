package io.matchpoint.dto;

import io.matchpoint.entity.Tournament.PaymentOption;
import java.time.LocalDate;
import java.util.List;

public interface TournamentSummaryDto {
    String getId();
    String getName();
    String getSlug();
    String getDescription();
    String getLocation();
    String getBanner();
    LocalDate getStartDate();
    LocalDate getEndDate();
    String getType();
    String getStatus();
    String getSport();
    LocalDate getAgeCutoffDate();
    LocalDate getWithdrawDate();
    Boolean getCollectsFees();
    java.math.BigDecimal getEntryFee();
    String getCurrency();
    List<PaymentOption> getPaymentOptions();
    Integer getTeamSizeLimit();
    String[] getTeamTieEvents();
    List<io.matchpoint.entity.Tournament.TeamTieConfig> getTeamTieConfigs();
    Integer getBonusPointMargin();
    Integer getBonusPointValue();
}
