package com.monargent.backend.mapper;

import com.monargent.backend.dto.fixedexpense.FixedExpenseCreateRequest;
import com.monargent.backend.dto.fixedexpense.FixedExpenseResponse;
import com.monargent.backend.dto.fixedexpense.FixedExpenseUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.FixedExpense;
import org.springframework.stereotype.Component;

@Component
public class FixedExpenseMapper {

    public FixedExpense toEntity(FixedExpenseCreateRequest request, Category category) {
        return FixedExpense.builder()
            .title(request.getTitle().trim())
            .amount(request.getAmount())
            .dueDay(request.getDueDay())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .active(request.getActive() == null || request.getActive())
            .category(category)
            .build();
    }

    public void updateEntity(FixedExpense fixedExpense, FixedExpenseUpdateRequest request, Category category) {
        fixedExpense.setTitle(request.getTitle().trim());
        fixedExpense.setAmount(request.getAmount());
        fixedExpense.setDueDay(request.getDueDay());
        fixedExpense.setStartDate(request.getStartDate());
        fixedExpense.setEndDate(request.getEndDate());
        fixedExpense.setActive(request.getActive() == null || request.getActive());
        fixedExpense.setCategory(category);
    }

    public FixedExpenseResponse toResponse(FixedExpense fixedExpense) {
        return FixedExpenseResponse.builder()
            .id(fixedExpense.getId())
            .title(fixedExpense.getTitle())
            .amount(fixedExpense.getAmount())
            .dueDay(fixedExpense.getDueDay())
            .startDate(fixedExpense.getStartDate())
            .endDate(fixedExpense.getEndDate())
            .active(fixedExpense.isActive())
            .categoryId(fixedExpense.getCategory().getId())
            .categoryName(fixedExpense.getCategory().getName())
            .createdAt(fixedExpense.getCreatedAt())
            .build();
    }
}