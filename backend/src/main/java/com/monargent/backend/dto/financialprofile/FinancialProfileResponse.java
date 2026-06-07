package com.monargent.backend.dto.financialprofile;

import com.monargent.backend.enums.FinancialModel;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialProfileResponse {

    private Long id;
    private BigDecimal monthlyIncome;
    private LocalDate salaryDate;
    private FinancialModel financialModel;
    private BigDecimal monthlySavingsGoal;
    private String currency;
    private LocalDateTime createdAt;
}