package com.monargent.backend.dto.group;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupSettlementMarkPaidRequest {

    @NotBlank
    private String fromMemberKey;

    @NotBlank
    private String toMemberKey;
}
