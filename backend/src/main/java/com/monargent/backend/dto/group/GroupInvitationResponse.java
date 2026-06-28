package com.monargent.backend.dto.group;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupInvitationResponse {

    private Long id;
    private Long groupId;
    private String groupTitle;
    private String invitedByName;
    private String invitedByEmail;
    private String status;
    private LocalDateTime createdAt;
}
