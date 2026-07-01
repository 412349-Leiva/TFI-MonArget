package com.monargent.backend.dto.profile;

import com.monargent.backend.enums.FinancialMoodLevel;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialMoodResponse {

    private FinancialMoodLevel level;
    private int score;
    private int maxScore;
    private String statusTitle;
    private String statusDescription;
    private List<FinancialMoodFactorResponse> factors;
    private Integer month;
    private Integer year;
}
