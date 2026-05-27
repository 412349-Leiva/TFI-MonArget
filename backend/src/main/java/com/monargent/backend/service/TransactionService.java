package com.monargent.backend.service;

import com.monargent.backend.dto.transaction.TransactionCreateRequest;
import com.monargent.backend.dto.transaction.TransactionResponse;
import com.monargent.backend.dto.transaction.TransactionUpdateRequest;
import com.monargent.backend.enums.TransactionType;
import java.util.List;

public interface TransactionService {

    List<TransactionResponse> findAll(Integer month, Integer year, Long categoryId, TransactionType type);

    TransactionResponse getById(Long id);

    TransactionResponse create(TransactionCreateRequest request);

    TransactionResponse update(Long id, TransactionUpdateRequest request);

    void delete(Long id);
}