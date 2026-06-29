package com.monargent.backend.repository;

import com.monargent.backend.entity.FixedExpense;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FixedExpenseRepository extends JpaRepository<FixedExpense, Long> {

    List<FixedExpense> findAllByUserId(Long userId);

    List<FixedExpense> findByActiveTrue();

    Optional<FixedExpense> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndCategoryId(Long userId, Long categoryId);
}