package com.monargent.backend.mapper;

import com.monargent.backend.dto.spendinglimit.SpendingLimitCreateRequest;
import com.monargent.backend.dto.spendinglimit.SpendingLimitResponse;
import com.monargent.backend.dto.spendinglimit.SpendingLimitUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.SpendingLimit;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class SpendingLimitMapper {

    public SpendingLimit toEntity(SpendingLimitCreateRequest request, Category category) {
        return SpendingLimit.builder()
            .amountLimit(request.getAmountLimit())
            .currentAmount(BigDecimal.ZERO)
            .month(request.getMonth())
            .year(request.getYear())
            .category(category)
            .build();
    }

    public void updateEntity(SpendingLimit spendingLimit, SpendingLimitUpdateRequest request, Category category) {
        spendingLimit.setAmountLimit(request.getAmountLimit());
        spendingLimit.setMonth(request.getMonth());
        spendingLimit.setYear(request.getYear());
        spendingLimit.setCategory(category);
    }

    public SpendingLimitResponse toResponse(SpendingLimit spendingLimit) {
        return SpendingLimitResponse.builder()
            .id(spendingLimit.getId())
            .amountLimit(spendingLimit.getAmountLimit())
            .currentAmount(spendingLimit.getCurrentAmount())
            .month(spendingLimit.getMonth())
            .year(spendingLimit.getYear())
            .categoryId(spendingLimit.getCategory().getId())
            .categoryName(spendingLimit.getCategory().getName())
            .createdAt(spendingLimit.getCreatedAt())
            .build();
    }
}