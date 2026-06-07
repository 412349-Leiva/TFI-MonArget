package com.monargent.backend.repository;

import com.monargent.backend.entity.SpendingLimit;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpendingLimitRepository extends JpaRepository<SpendingLimit, Long> {

    List<SpendingLimit> findAllByUserId(Long userId);

    Optional<SpendingLimit> findByIdAndUserId(Long id, Long userId);

    Optional<SpendingLimit> findByUserIdAndCategoryIdAndMonthAndYear(Long userId, Long categoryId, Integer month, Integer year);

    boolean existsByUserIdAndCategoryId(Long userId, Long categoryId);
}