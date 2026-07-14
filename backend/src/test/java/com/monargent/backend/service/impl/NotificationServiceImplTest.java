package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.notification.NotificationResponse;
import com.monargent.backend.entity.Notification;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.NotificationType;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.repository.NotificationRepository;
import com.monargent.backend.service.CurrentUserService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private CurrentUserService currentUserService;

    @InjectMocks
    private NotificationServiceImpl service;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("n@example.com").password("x").verified(true).build();
    }

    @Test
    void findAllAndCountUnread() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        Notification n = Notification.builder()
            .id(5L).type(NotificationType.ALERT).message("Hola").read(false)
            .createdAt(LocalDateTime.now()).user(user).build();
        when(notificationRepository.findAllByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n));
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(1L);

        List<NotificationResponse> all = service.findAll();
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getMessage()).isEqualTo("Hola");
        assertThat(service.countUnread()).isEqualTo(1L);
    }

    @Test
    void markAsRead_andDelete() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        Notification n = Notification.builder()
            .id(5L).type(NotificationType.GROUP).message("x").read(false).user(user).build();
        when(notificationRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(n));
        when(notificationRepository.save(n)).thenReturn(n);

        assertThat(service.markAsRead(5L).isRead()).isTrue();
        service.delete(5L);
        verify(notificationRepository).delete(n);
    }

    @Test
    void markAllAsRead() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        Notification n1 = Notification.builder().id(1L).read(false).build();
        Notification n2 = Notification.builder().id(2L).read(false).build();
        when(notificationRepository.findAllByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(n1, n2));
        service.markAllAsRead();
        assertThat(n1.isRead()).isTrue();
        assertThat(n2.isRead()).isTrue();
    }

    @Test
    void createNotification_withAndWithoutReference() {
        service.createNotification(user, NotificationType.ALERT, "msg");
        verify(notificationRepository).save(any(Notification.class));

        service.createNotification(user, NotificationType.GROUP, "msg2", 99L);
        verify(notificationRepository, org.mockito.Mockito.times(2)).save(any(Notification.class));
    }

    @Test
    void createIfNotRecent_skipsWhenExists_withReference() {
        when(notificationRepository.existsByUserIdAndTypeAndReferenceIdAndCreatedAtAfter(
            any(), any(), any(), any())).thenReturn(true);
        service.createIfNotRecent(user, NotificationType.ALERT, "dup", 10L, 23);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void createIfNotRecent_createsWhenMissing_withoutReference() {
        when(notificationRepository.existsByUserIdAndTypeAndMessageAndCreatedAtAfter(
            any(), any(), any(), any())).thenReturn(false);
        service.createIfNotRecent(user, NotificationType.REMINDER, "nuevo", null, 5);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void findOwned_missing_throws() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(notificationRepository.findByIdAndUserId(8L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.markAsRead(8L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Notificación no encontrada");
    }
}
