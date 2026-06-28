package com.monargent.backend.dto.group;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponse {

    private String memberKey;
    private Long userId;
    private String name;
    private String nick;
    private String email;
    private String mpAlias;
    private boolean guest;
    private Long guestId;
    private boolean currentUser;
    private BigDecimal totalSpent;
    private List<GroupExpenseItemResponse> items;
}
