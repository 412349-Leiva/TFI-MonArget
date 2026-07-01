package com.monargent.backend.dto.profile;

import com.monargent.backend.enums.FinancialMoodFactorTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialMoodFactorResponse {

    private String key;
    private String label;
    private int maxPoints;
    private int points;
    private FinancialMoodFactorTier tier;
    private String detail;
}
