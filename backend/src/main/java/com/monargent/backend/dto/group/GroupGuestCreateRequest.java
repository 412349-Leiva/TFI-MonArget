package com.monargent.backend.dto.group;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupGuestCreateRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(max = 50)
    private String mpAlias;

    @NotBlank
    @Email
    @Size(max = 150)
    private String email;

    @Size(max = 150)
    private String expenseTitle;

    private BigDecimal expenseAmount;

    @Valid
    @Builder.Default
    private List<GroupExpenseItemRequest> items = new ArrayList<>();

    public List<GroupExpenseItemRequest> resolvedItems() {
        List<GroupExpenseItemRequest> resolved = new ArrayList<>();
        if (items != null) {
            resolved.addAll(items);
        }
        if (expenseTitle != null && !expenseTitle.isBlank()
            && expenseAmount != null && expenseAmount.compareTo(BigDecimal.ZERO) > 0) {
            resolved.add(GroupExpenseItemRequest.builder()
                .title(expenseTitle.trim())
                .amount(expenseAmount)
                .build());
        }
        return resolved;
    }
}
