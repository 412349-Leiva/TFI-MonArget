package com.monargent.backend.service.impl;

import com.monargent.backend.dto.notification.NotificationResponse;
import com.monargent.backend.entity.Notification;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.NotificationType;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.repository.NotificationRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.NotificationService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> findAll() {
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(currentUserService.getCurrentUserId())
            .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread() {
        return notificationRepository.countByUserIdAndReadFalse(currentUserService.getCurrentUserId());
    }

    @Override
    public NotificationResponse markAsRead(Long id) {
        Notification notification = findOwned(id);
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    public void markAllAsRead() {
        notificationRepository.findAllByUserIdOrderByCreatedAtDesc(currentUserService.getCurrentUserId())
            .forEach(n -> n.setRead(true));
    }

    @Override
    public void delete(Long id) {
        notificationRepository.delete(findOwned(id));
    }

    @Override
    public void createNotification(User user, NotificationType type, String message) {
        createNotification(user, type, message, null);
    }

    @Override
    public void createNotification(User user, NotificationType type, String message, Long referenceId) {
        notificationRepository.save(Notification.builder()
            .user(user)
            .type(type)
            .message(message)
            .referenceId(referenceId)
            .read(false)
            .build());
    }

    @Override
    public void createIfNotRecent(User user, NotificationType type, String message, Long referenceId, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        boolean exists = referenceId != null
            ? notificationRepository.existsByUserIdAndTypeAndReferenceIdAndCreatedAtAfter(
                user.getId(), type, referenceId, since)
            : notificationRepository.existsByUserIdAndTypeAndMessageAndCreatedAtAfter(
                user.getId(), type, message, since);
        if (!exists) {
            createNotification(user, type, message, referenceId);
        }
    }

    private Notification findOwned(Long id) {
        return notificationRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada"));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId())
            .type(n.getType())
            .message(n.getMessage())
            .referenceId(n.getReferenceId())
            .read(n.isRead())
            .createdAt(n.getCreatedAt())
            .build();
    }
}
