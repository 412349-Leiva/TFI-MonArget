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
public class GroupSettlementResponse {

    private String fromMemberKey;
    private String toMemberKey;
    private String fromNick;
    private String fromMpAlias;
    private String toNick;
    private String toMpAlias;
    private BigDecimal amount;
    private boolean involvesCurrentUser;
    private boolean toMpCheckoutAvailable;
    private boolean paid;
}
