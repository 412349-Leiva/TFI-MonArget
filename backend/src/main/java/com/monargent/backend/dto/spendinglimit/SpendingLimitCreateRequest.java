package com.monargent.backend.dto.spendinglimit;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingLimitCreateRequest {

    @NotNull
    @PositiveOrZero
    private BigDecimal amountLimit;

    @Min(1)
    @Max(12)
    private Integer month;

    @Min(1900)
    private Integer year;

    @NotNull
    private Long categoryId;
}