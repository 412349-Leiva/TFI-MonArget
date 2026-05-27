package com.monargent.backend.dto.fixedexpense;

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
public class FixedExpenseResponse {

    private Long id;
    private String title;
    private BigDecimal amount;
    private Integer dueDay;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
}