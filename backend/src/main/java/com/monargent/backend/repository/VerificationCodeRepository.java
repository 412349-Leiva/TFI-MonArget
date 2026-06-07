package com.monargent.backend.repository;

import com.monargent.backend.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    Optional<VerificationCode> findFirstByEmailIgnoreCaseAndCode(String email, String code);
    Optional<VerificationCode> findFirstByEmailIgnoreCaseAndVerifiedTrue(String email);
    Optional<VerificationCode> findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    List<VerificationCode> findByEmailIgnoreCase(String email);
}
