package com.monargent.backend.dto.importation;

import com.monargent.backend.enums.TransactionType;
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
public class ExtractedMovementDTO {

    private String tempId;
    private TransactionType type;
    private String description;
    private String suggestedCategory;
    private Long suggestedCategoryId;
    private BigDecimal amount;
    private LocalDate date;
}
