package com.monargent.backend.dto.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponse {

    private Long userId;
    private String name;
    private String email;
    private String mpAlias;
    private boolean guest;
    private Long guestId;
}
