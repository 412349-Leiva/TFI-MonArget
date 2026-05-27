package com.monargent.backend.mapper;

import com.monargent.backend.dto.transaction.TransactionCreateRequest;
import com.monargent.backend.dto.transaction.TransactionResponse;
import com.monargent.backend.dto.transaction.TransactionUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.Transaction;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper {

    public Transaction toEntity(TransactionCreateRequest request, Category category) {
        return Transaction.builder()
            .title(request.getTitle().trim())
            .description(request.getDescription())
            .amount(request.getAmount())
            .date(request.getDate())
            .type(request.getType())
            .category(category)
            .build();
    }

    public void updateEntity(Transaction transaction, TransactionUpdateRequest request, Category category) {
        transaction.setTitle(request.getTitle().trim());
        transaction.setDescription(request.getDescription());
        transaction.setAmount(request.getAmount());
        transaction.setDate(request.getDate());
        transaction.setType(request.getType());
        transaction.setCategory(category);
    }

    public TransactionResponse toResponse(Transaction transaction) {
        return TransactionResponse.builder()
            .id(transaction.getId())
            .title(transaction.getTitle())
            .description(transaction.getDescription())
            .amount(transaction.getAmount())
            .date(transaction.getDate())
            .type(transaction.getType())
            .categoryId(transaction.getCategory().getId())
            .categoryName(transaction.getCategory().getName())
            .createdAt(transaction.getCreatedAt())
            .build();
    }
}