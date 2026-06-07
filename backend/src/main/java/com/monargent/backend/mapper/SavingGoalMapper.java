package com.monargent.backend.mapper;

import com.monargent.backend.dto.savinggoal.SavingGoalCreateRequest;
import com.monargent.backend.dto.savinggoal.SavingGoalResponse;
import com.monargent.backend.dto.savinggoal.SavingGoalUpdateRequest;
import com.monargent.backend.entity.SavingGoal;
import org.springframework.stereotype.Component;

@Component
public class SavingGoalMapper {

    public SavingGoal toEntity(SavingGoalCreateRequest request) {
        return SavingGoal.builder()
            .title(request.getTitle().trim())
            .description(request.getDescription())
            .targetAmount(request.getTargetAmount())
            .targetDate(request.getTargetDate())
            .status(request.getStatus())
            .build();
    }

    public void updateEntity(SavingGoal goal, SavingGoalUpdateRequest request) {
        goal.setTitle(request.getTitle().trim());
        goal.setDescription(request.getDescription());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setTargetDate(request.getTargetDate());
        goal.setStatus(request.getStatus());
    }

    public SavingGoalResponse toResponse(SavingGoal goal) {
        return SavingGoalResponse.builder()
            .id(goal.getId())
            .title(goal.getTitle())
            .description(goal.getDescription())
            .targetAmount(goal.getTargetAmount())
            .currentAmount(goal.getCurrentAmount())
            .targetDate(goal.getTargetDate())
            .status(goal.getStatus())
            .createdAt(goal.getCreatedAt())
            .build();
    }
}
