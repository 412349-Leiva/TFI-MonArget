package com.monargent.backend.dto.group;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupExpenseBatchRequest {

    @NotEmpty
    @Valid
    private List<GroupExpenseItemRequest> items;
}
