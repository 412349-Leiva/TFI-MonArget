package com.monargent.backend.repository;

import com.monargent.backend.entity.FinancialProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialProfileRepository extends JpaRepository<FinancialProfile, Long> {

    Optional<FinancialProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}