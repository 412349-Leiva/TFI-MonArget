package com.monargent.backend.service.impl;

import com.monargent.backend.dto.transaction.TransactionCreateRequest;
import com.monargent.backend.dto.transaction.TransactionResponse;
import com.monargent.backend.dto.transaction.TransactionUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.Transaction;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.TransactionMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.repository.specification.TransactionSpecifications;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.TransactionService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final SpendingLimitRepository spendingLimitRepository;
    private final CurrentUserService currentUserService;
    private final TransactionMapper transactionMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> findAll(Integer month, Integer year, Long categoryId, TransactionType type) {
        Long userId = currentUserService.getCurrentUserId();
        Specification<Transaction> specification = Specification.where(TransactionSpecifications.hasUserId(userId));

        if (month != null) {
            int resolvedYear = year != null ? year : LocalDate.now().getYear();
            specification = specification.and(TransactionSpecifications.hasMonth(month))
                .and(TransactionSpecifications.hasYear(resolvedYear));
        } else if (year != null) {
            specification = specification.and(TransactionSpecifications.hasYear(year));
        }

        if (categoryId != null) {
            specification = specification.and(TransactionSpecifications.hasCategoryId(categoryId));
        }

        if (type != null) {
            specification = specification.and(TransactionSpecifications.hasType(type));
        }

        return transactionRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "date")).stream()
            .map(transactionMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getById(Long id) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        return transactionMapper.toResponse(transaction);
    }

    @Override
    public TransactionResponse create(TransactionCreateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (!category.getType().name().equals(request.getType().name())) {
            throw new InvalidRequestException("Transaction type must match the category type");
        }

        Transaction transaction = transactionMapper.toEntity(request, category);
        transaction.setUser(currentUserService.getCurrentUser());
        Transaction saved = transactionRepository.save(transaction);

        if (saved.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(userId, category.getId(), saved.getDate().getMonthValue(), saved.getDate().getYear(), saved.getAmount());
        }

        return transactionMapper.toResponse(saved);
    }

    @Override
    public TransactionResponse update(Long id, TransactionUpdateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (!category.getType().name().equals(request.getType().name())) {
            throw new InvalidRequestException("Transaction type must match the category type");
        }

        // Reverse old spending limit contribution before applying updated values
        if (transaction.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(userId, transaction.getCategory().getId(),
                transaction.getDate().getMonthValue(), transaction.getDate().getYear(),
                transaction.getAmount().negate());
        }

        transactionMapper.updateEntity(transaction, request, category);
        Transaction saved = transactionRepository.save(transaction);

        if (saved.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(userId, category.getId(), saved.getDate().getMonthValue(), saved.getDate().getYear(), saved.getAmount());
        }

        return transactionMapper.toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        Long userId = currentUserService.getCurrentUserId();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (transaction.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(userId, transaction.getCategory().getId(),
                transaction.getDate().getMonthValue(), transaction.getDate().getYear(),
                transaction.getAmount().negate());
        }

        transactionRepository.delete(transaction);
    }

    private void updateSpendingLimit(Long userId, Long categoryId, int month, int year, BigDecimal delta) {
        spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, categoryId, month, year)
            .ifPresent(limit -> {
                limit.setCurrentAmount(limit.getCurrentAmount().add(delta).max(BigDecimal.ZERO));
                spendingLimitRepository.save(limit);
            });
    }
}