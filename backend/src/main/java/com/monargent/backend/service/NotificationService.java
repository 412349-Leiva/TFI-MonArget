package com.monargent.backend.service;

import com.monargent.backend.dto.notification.NotificationResponse;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.NotificationType;
import java.util.List;

public interface NotificationService {

    List<NotificationResponse> findAll();

    long countUnread();

    NotificationResponse markAsRead(Long id);

    void markAllAsRead();

    void delete(Long id);

    void createNotification(User user, NotificationType type, String message);

    void createNotification(User user, NotificationType type, String message, Long referenceId);

    void createIfNotRecent(User user, NotificationType type, String message, Long referenceId, int hours);
}
