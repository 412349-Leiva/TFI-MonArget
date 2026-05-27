package com.monargent.backend.repository.specification;

import com.monargent.backend.entity.Transaction;
import com.monargent.backend.enums.TransactionType;
import org.springframework.data.jpa.domain.Specification;

public final class TransactionSpecifications {

    private TransactionSpecifications() {
    }

    public static Specification<Transaction> hasUserId(Long userId) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("user").get("id"), userId);
    }

    public static Specification<Transaction> hasMonth(Integer month) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(criteriaBuilder.function("month", Integer.class, root.get("date")), month);
    }

    public static Specification<Transaction> hasYear(Integer year) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(criteriaBuilder.function("year", Integer.class, root.get("date")), year);
    }

    public static Specification<Transaction> hasCategoryId(Long categoryId) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Transaction> hasType(TransactionType type) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("type"), type);
    }
}