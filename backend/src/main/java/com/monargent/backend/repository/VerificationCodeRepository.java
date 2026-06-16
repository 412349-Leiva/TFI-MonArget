package com.monargent.backend.repository;

import com.monargent.backend.entity.VerificationCode;
import com.monargent.backend.enums.VerificationPurpose;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    Optional<VerificationCode> findFirstByEmailIgnoreCaseAndCode(String email, String code);
    Optional<VerificationCode> findFirstByEmailIgnoreCaseAndCodeAndPurpose(
        String email, String code, VerificationPurpose purpose);
    Optional<VerificationCode> findFirstByEmailIgnoreCaseAndVerifiedTrue(String email);
    Optional<VerificationCode> findFirstByEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    Optional<VerificationCode> findFirstByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(
        String email, VerificationPurpose purpose);
    List<VerificationCode> findByEmailIgnoreCase(String email);
    List<VerificationCode> findByEmailIgnoreCaseAndPurpose(String email, VerificationPurpose purpose);
}
