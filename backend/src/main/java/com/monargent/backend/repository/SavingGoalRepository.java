package com.monargent.backend.repository;

import com.monargent.backend.entity.SavingGoal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavingGoalRepository extends JpaRepository<SavingGoal, Long> {

    List<SavingGoal> findAllByUserId(Long userId);

    Optional<SavingGoal> findByIdAndUserId(Long id, Long userId);
}
