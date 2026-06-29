package com.monargent.backend.repository;

import com.monargent.backend.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndReadFalse(Long userId);

    boolean existsByUserIdAndTypeAndReferenceIdAndCreatedAtAfter(
        Long userId,
        com.monargent.backend.enums.NotificationType type,
        Long referenceId,
        java.time.LocalDateTime since
    );

    boolean existsByUserIdAndTypeAndMessageAndCreatedAtAfter(
        Long userId,
        com.monargent.backend.enums.NotificationType type,
        String message,
        java.time.LocalDateTime since
    );
}
