package com.monargent.backend.dto.transaction;

import com.monargent.backend.enums.TransactionType;
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
public class TransactionResponse {

    private Long id;
    private String title;
    private String description;
    private BigDecimal amount;
    private LocalDateTime date;
    private TransactionType type;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime createdAt;
}