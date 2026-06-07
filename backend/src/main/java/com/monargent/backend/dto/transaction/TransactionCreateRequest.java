package com.monargent.backend.dto.transaction;

import com.monargent.backend.enums.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
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
public class TransactionCreateRequest {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    @PositiveOrZero
    private BigDecimal amount;

    @NotNull
    private LocalDateTime date;

    @NotNull
    private TransactionType type;

    @NotNull
    private Long categoryId;
}