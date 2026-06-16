package com.monargent.backend.service;

import com.monargent.backend.dto.importation.ImportMovementItemRequest;
import com.monargent.backend.dto.transaction.TransactionCreateRequest;
import com.monargent.backend.dto.transaction.TransactionResponse;
import com.monargent.backend.dto.transaction.TransactionUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.Receipt;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.enums.TransactionType;
import java.math.BigDecimal;
import java.util.List;

public interface TransactionService {

    List<TransactionResponse> findAll(Integer month, Integer year, Long categoryId, TransactionType type);

    TransactionResponse getById(Long id);

    TransactionResponse create(TransactionCreateRequest request);

    TransactionResponse createFromImport(ImportMovementItemRequest request, Category category, Receipt receipt);

    TransactionResponse createFromSavingGoalDeposit(SavingGoal goal, BigDecimal amount);

    TransactionResponse update(Long id, TransactionUpdateRequest request);

    void delete(Long id);
}