package com.monargent.backend.dto.spendinglimit;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingLimitResponse {

    private Long id;
    private BigDecimal amountLimit;
    private BigDecimal currentAmount;
    private Integer month;
    private Integer year;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
}