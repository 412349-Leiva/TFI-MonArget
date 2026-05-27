package com.monargent.backend.mapper;

import com.monargent.backend.dto.financialprofile.FinancialProfileCreateRequest;
import com.monargent.backend.dto.financialprofile.FinancialProfileResponse;
import com.monargent.backend.dto.financialprofile.FinancialProfileUpdateRequest;
import com.monargent.backend.entity.FinancialProfile;
import org.springframework.stereotype.Component;

@Component
public class FinancialProfileMapper {

    public FinancialProfile toEntity(FinancialProfileCreateRequest request) {
        return FinancialProfile.builder()
            .monthlyIncome(request.getMonthlyIncome())
            .salaryDate(request.getSalaryDate())
            .financialModel(request.getFinancialModel())
            .monthlySavingsGoal(request.getMonthlySavingsGoal())
            .currency(request.getCurrency().trim().toUpperCase())
            .build();
    }

    public void updateEntity(FinancialProfile profile, FinancialProfileUpdateRequest request) {
        profile.setMonthlyIncome(request.getMonthlyIncome());
        profile.setSalaryDate(request.getSalaryDate());
        profile.setFinancialModel(request.getFinancialModel());
        profile.setMonthlySavingsGoal(request.getMonthlySavingsGoal());
        profile.setCurrency(request.getCurrency().trim().toUpperCase());
    }

    public FinancialProfileResponse toResponse(FinancialProfile profile) {
        return FinancialProfileResponse.builder()
            .id(profile.getId())
            .monthlyIncome(profile.getMonthlyIncome())
            .salaryDate(profile.getSalaryDate())
            .financialModel(profile.getFinancialModel())
            .monthlySavingsGoal(profile.getMonthlySavingsGoal())
            .currency(profile.getCurrency())
            .createdAt(profile.getCreatedAt())
            .build();
    }
}