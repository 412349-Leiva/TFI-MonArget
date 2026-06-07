package com.monargent.backend.dto.savinggoal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingGoalDepositRequest {

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;
}
