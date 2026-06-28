package com.monargent.backend.dto.group;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupResponse {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime createdAt;
    private int memberCount;
    private BigDecimal totalExpenses;
    private BigDecimal myBalance;
    private List<GroupMemberResponse> members;
    private List<GroupExpenseResponse> expenses;
}
