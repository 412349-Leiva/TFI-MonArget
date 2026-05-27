package com.monargent.backend.dto.financialprofile;

import com.monargent.backend.enums.FinancialModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialProfileUpdateRequest {

    @NotNull
    @PositiveOrZero
    private BigDecimal monthlyIncome;

    private LocalDate salaryDate;

    @NotNull
    private FinancialModel financialModel;

    @NotNull
    @PositiveOrZero
    private BigDecimal monthlySavingsGoal;

    @NotBlank
    @Size(min = 3, max = 3)
    private String currency;
}