package com.monargent.backend.service.impl;

import com.monargent.backend.dto.spendinglimit.SpendingLimitCreateRequest;
import com.monargent.backend.dto.spendinglimit.SpendingLimitResponse;
import com.monargent.backend.dto.spendinglimit.SpendingLimitUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.exception.ResourceAlreadyExistsException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.SpendingLimitMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.SpendingLimitService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SpendingLimitServiceImpl implements SpendingLimitService {

    private final SpendingLimitRepository spendingLimitRepository;
    private final CategoryRepository categoryRepository;
    private final CurrentUserService currentUserService;
    private final SpendingLimitMapper spendingLimitMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SpendingLimitResponse> findAll() {
        Long userId = currentUserService.getCurrentUserId();
        return spendingLimitRepository.findAllByUserId(userId).stream()
            .map(spendingLimitMapper::toResponse)
            .toList();
    }

    @Override
    public SpendingLimitResponse create(SpendingLimitCreateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, category.getId(), request.getMonth(), request.getYear()).isPresent()) {
            throw new ResourceAlreadyExistsException("Spending limit already exists for this category and period");
        }

        SpendingLimit spendingLimit = spendingLimitMapper.toEntity(request, category);
        spendingLimit.setUser(currentUserService.getCurrentUser());
        return spendingLimitMapper.toResponse(spendingLimitRepository.save(spendingLimit));
    }

    @Override
    public SpendingLimitResponse update(Long id, SpendingLimitUpdateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        SpendingLimit spendingLimit = spendingLimitRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Spending limit not found"));

        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        spendingLimitMapper.updateEntity(spendingLimit, request, category);
        return spendingLimitMapper.toResponse(spendingLimitRepository.save(spendingLimit));
    }

    @Override
    public void delete(Long id) {
        SpendingLimit spendingLimit = spendingLimitRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Spending limit not found"));
        spendingLimitRepository.delete(spendingLimit);
    }
}