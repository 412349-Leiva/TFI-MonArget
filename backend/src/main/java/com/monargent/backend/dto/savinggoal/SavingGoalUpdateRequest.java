package com.monargent.backend.dto.savinggoal;

import com.monargent.backend.enums.SavingGoalStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class SavingGoalUpdateRequest {

    @NotBlank
    @Size(max = 150)
    private String title;

    @Size(max = 500)
    private String description;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal targetAmount;

    private LocalDate targetDate;

    @NotNull
    private SavingGoalStatus status;
}
