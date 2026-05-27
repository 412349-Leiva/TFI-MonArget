package com.monargent.backend.dto.fixedexpense;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
public class FixedExpenseCreateRequest {

    @NotBlank
    private String title;

    @NotNull
    @PositiveOrZero
    private BigDecimal amount;

    @Min(1)
    @Max(31)
    private Integer dueDay;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean active;

    @NotNull
    private Long categoryId;
}