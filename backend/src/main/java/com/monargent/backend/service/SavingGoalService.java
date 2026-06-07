package com.monargent.backend.service;

import com.monargent.backend.dto.savinggoal.SavingGoalCreateRequest;
import com.monargent.backend.dto.savinggoal.SavingGoalDepositRequest;
import com.monargent.backend.dto.savinggoal.SavingGoalResponse;
import com.monargent.backend.dto.savinggoal.SavingGoalUpdateRequest;
import java.util.List;

public interface SavingGoalService {

    List<SavingGoalResponse> findAll();

    SavingGoalResponse getById(Long id);

    SavingGoalResponse create(SavingGoalCreateRequest request);

    SavingGoalResponse update(Long id, SavingGoalUpdateRequest request);

    SavingGoalResponse deposit(Long id, SavingGoalDepositRequest request);

    void delete(Long id);
}
