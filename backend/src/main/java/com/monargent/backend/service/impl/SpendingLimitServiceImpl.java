package com.monargent.backend.service.impl;

import com.monargent.backend.dto.spendinglimit.SpendingLimitCreateRequest;
import com.monargent.backend.dto.spendinglimit.SpendingLimitResponse;
import com.monargent.backend.dto.spendinglimit.SpendingLimitUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.Transaction;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.ResourceAlreadyExistsException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.SpendingLimitMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.SpendingLimitAlertHelper;
import com.monargent.backend.service.SpendingLimitService;
import java.math.BigDecimal;
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
    private final TransactionRepository transactionRepository;
    private final CurrentUserService currentUserService;
    private final SpendingLimitMapper spendingLimitMapper;
    private final SpendingLimitAlertHelper spendingLimitAlertHelper;

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
            .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));

        if (spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, category.getId(), request.getMonth(), request.getYear()).isPresent()) {
            throw new ResourceAlreadyExistsException("Ya existe un límite para esta categoría en el período seleccionado");
        }

        SpendingLimit spendingLimit = spendingLimitMapper.toEntity(request, category);
        spendingLimit.setUser(currentUserService.getCurrentUser());
        spendingLimit.setCurrentAmount(sumExpensesForCategory(userId, category.getId(), request.getMonth(), request.getYear()));

        SpendingLimit saved = spendingLimitRepository.save(spendingLimit);
        spendingLimitAlertHelper.checkAndNotify(saved, BigDecimal.ZERO, saved.getCurrentAmount());
        return spendingLimitMapper.toResponse(saved);
    }

    @Override
    public SpendingLimitResponse update(Long id, SpendingLimitUpdateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        SpendingLimit spendingLimit = spendingLimitRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Límite de gasto no encontrado"));

        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));

        BigDecimal previous = spendingLimit.getCurrentAmount();
        spendingLimitMapper.updateEntity(spendingLimit, request, category);
        SpendingLimit saved = spendingLimitRepository.save(spendingLimit);
        spendingLimitAlertHelper.checkAndNotify(saved, previous, saved.getCurrentAmount());
        return spendingLimitMapper.toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        SpendingLimit spendingLimit = spendingLimitRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Límite de gasto no encontrado"));
        spendingLimitRepository.delete(spendingLimit);
    }

    private BigDecimal sumExpensesForCategory(Long userId, Long categoryId, int month, int year) {
        return transactionRepository.findAllByUserIdAndMonthAndYearAndCategoryId(userId, month, year, categoryId)
            .stream()
            .filter(tx -> tx.getType() == TransactionType.EXPENSE)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
