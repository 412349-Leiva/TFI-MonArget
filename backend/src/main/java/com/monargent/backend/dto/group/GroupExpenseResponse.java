package com.monargent.backend.dto.group;

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
public class GroupExpenseResponse {

    private Long id;
    private String title;
    private BigDecimal amount;
    private LocalDateTime date;
    private String paidByName;
    private String paidByAlias;
}
