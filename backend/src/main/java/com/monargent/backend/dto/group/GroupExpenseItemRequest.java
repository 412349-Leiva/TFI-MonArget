package com.monargent.backend.dto.group;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupExpenseItemRequest {

    private Long categoryId;

    @Size(max = 120)
    private String categoryName;

    @NotBlank
    @Size(max = 150)
    private String title;

    @DecimalMin(value = "0.01")
    private BigDecimal amount;
}
