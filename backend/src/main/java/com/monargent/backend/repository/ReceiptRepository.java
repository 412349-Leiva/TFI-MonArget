package com.monargent.backend.repository;

import com.monargent.backend.entity.Receipt;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReceiptRepository extends JpaRepository<Receipt, Long> {

    List<Receipt> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Receipt> findByIdAndUserId(Long id, Long userId);
}
