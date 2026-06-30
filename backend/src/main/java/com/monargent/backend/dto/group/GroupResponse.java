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
    private BigDecimal sharePerPerson;
    private BigDecimal myBalance;
    private String currentUserMemberKey;
    private List<GroupMemberResponse> members;
    private List<GroupSettlementResponse> settlements;
    private String lifecycleStatus;
    private boolean movementsConfirmed;
    private boolean paymentsEnabled;
    private boolean canConfirmMovements;
    private boolean currentUserConfirmedMovements;
    private int movementConfirmationsCount;
    private int movementConfirmationsRequired;
}
