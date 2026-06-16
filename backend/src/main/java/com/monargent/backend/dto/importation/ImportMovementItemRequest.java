package com.monargent.backend.dto.importation;

import com.monargent.backend.enums.TransactionType;
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
public class ImportMovementItemRequest {

    @NotNull
    private TransactionType type;

    @NotBlank
    private String description;

    @NotNull
    @PositiveOrZero
    private BigDecimal amount;

    private LocalDate date;

    private Long categoryId;

    private String categoryName;
}
