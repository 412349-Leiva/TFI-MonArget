package com.monargent.backend.repository;

import com.monargent.backend.entity.VerificationCode;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    Optional<VerificationCode> findFirstByEmailIgnoreCaseAndCode(String email, String code);
    Optional<VerificationCode> findFirstByEmailIgnoreCaseAndVerifiedTrue(String email);
    List<VerificationCode> findByEmailIgnoreCase(String email);
}
