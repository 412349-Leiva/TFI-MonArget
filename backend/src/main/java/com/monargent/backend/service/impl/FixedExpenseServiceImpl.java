package com.monargent.backend.service.impl;

import com.monargent.backend.dto.fixedexpense.FixedExpenseCreateRequest;
import com.monargent.backend.dto.fixedexpense.FixedExpenseResponse;
import com.monargent.backend.dto.fixedexpense.FixedExpenseUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.FixedExpense;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.FixedExpenseMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.FixedExpenseRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.FixedExpenseService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FixedExpenseServiceImpl implements FixedExpenseService {

    private final FixedExpenseRepository fixedExpenseRepository;
    private final CategoryRepository categoryRepository;
    private final CurrentUserService currentUserService;
    private final FixedExpenseMapper fixedExpenseMapper;

    @Override
    @Transactional(readOnly = true)
    public List<FixedExpenseResponse> findAll() {
        Long userId = currentUserService.getCurrentUserId();
        return fixedExpenseRepository.findAllByUserId(userId).stream()
            .map(fixedExpenseMapper::toResponse)
            .toList();
    }

    @Override
    public FixedExpenseResponse create(FixedExpenseCreateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        FixedExpense fixedExpense = fixedExpenseMapper.toEntity(request, category);
        fixedExpense.setUser(currentUserService.getCurrentUser());
        return fixedExpenseMapper.toResponse(fixedExpenseRepository.save(fixedExpense));
    }

    @Override
    public FixedExpenseResponse update(Long id, FixedExpenseUpdateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        FixedExpense fixedExpense = fixedExpenseRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Fixed expense not found"));

        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        fixedExpenseMapper.updateEntity(fixedExpense, request, category);
        return fixedExpenseMapper.toResponse(fixedExpenseRepository.save(fixedExpense));
    }

    @Override
    public void delete(Long id) {
        FixedExpense fixedExpense = fixedExpenseRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Fixed expense not found"));
        fixedExpenseRepository.delete(fixedExpense);
    }
}