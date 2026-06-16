package com.monargent.backend.service.impl;

import com.monargent.backend.dto.savinggoal.SavingGoalCreateRequest;
import com.monargent.backend.dto.savinggoal.SavingGoalDepositRequest;
import com.monargent.backend.dto.savinggoal.SavingGoalResponse;
import com.monargent.backend.dto.savinggoal.SavingGoalUpdateRequest;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.enums.SavingGoalStatus;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.SavingGoalMapper;
import com.monargent.backend.repository.SavingGoalRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.SavingGoalService;
import com.monargent.backend.service.TransactionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SavingGoalServiceImpl implements SavingGoalService {

    private final SavingGoalRepository savingGoalRepository;
    private final CurrentUserService currentUserService;
    private final SavingGoalMapper savingGoalMapper;
    private final TransactionService transactionService;

    @Override
    @Transactional(readOnly = true)
    public List<SavingGoalResponse> findAll() {
        return savingGoalRepository.findAllByUserId(currentUserService.getCurrentUserId()).stream()
            .map(savingGoalMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SavingGoalResponse getById(Long id) {
        return savingGoalMapper.toResponse(findOwnedGoal(id));
    }

    @Override
    public SavingGoalResponse create(SavingGoalCreateRequest request) {
        SavingGoal goal = savingGoalMapper.toEntity(request);
        goal.setUser(currentUserService.getCurrentUser());
        return savingGoalMapper.toResponse(savingGoalRepository.save(goal));
    }

    @Override
    public SavingGoalResponse update(Long id, SavingGoalUpdateRequest request) {
        SavingGoal goal = findOwnedGoal(id);
        savingGoalMapper.updateEntity(goal, request);
        return savingGoalMapper.toResponse(savingGoalRepository.save(goal));
    }

    @Override
    public SavingGoalResponse deposit(Long id, SavingGoalDepositRequest request) {
        SavingGoal goal = findOwnedGoal(id);

        if (goal.getStatus() != SavingGoalStatus.ACTIVE) {
            throw new InvalidRequestException("Deposits are only allowed on ACTIVE goals");
        }

        transactionService.createFromSavingGoalDeposit(goal, request.getAmount());

        goal.setCurrentAmount(goal.getCurrentAmount().add(request.getAmount()));

        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) {
            goal.setCurrentAmount(goal.getTargetAmount());
            goal.setStatus(SavingGoalStatus.COMPLETED);
        }

        return savingGoalMapper.toResponse(savingGoalRepository.save(goal));
    }

    @Override
    public void delete(Long id) {
        savingGoalRepository.delete(findOwnedGoal(id));
    }

    private SavingGoal findOwnedGoal(Long id) {
        return savingGoalRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Saving goal not found"));
    }
}
