package com.monargent.backend.dto.group;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupSummaryResponse {

    private Long id;
    private String title;
    private int memberCount;
    private BigDecimal totalExpenses;
    private BigDecimal myBalance;
    private boolean owner;
}
