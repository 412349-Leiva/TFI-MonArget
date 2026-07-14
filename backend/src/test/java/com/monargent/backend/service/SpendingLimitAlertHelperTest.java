package com.monargent.backend.service;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.enums.NotificationType;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SpendingLimitAlertHelperTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private SpendingLimitAlertHelper alertHelper;

    @Test
    void checkAndNotify_crossing100Percent_createsAlertNotification() {
        User user = User.builder()
            .id(1L)
            .name("Mon")
            .lastname("Argent")
            .email("alert@example.com")
            .password("secret")
            .verified(true)
            .build();
        Category category = Category.builder()
            .id(2L)
            .name("Ocio")
            .type(CategoryType.EXPENSE)
            .user(user)
            .build();
        SpendingLimit limit = SpendingLimit.builder()
            .id(10L)
            .amountLimit(new BigDecimal("100"))
            .currentAmount(new BigDecimal("100"))
            .month(7)
            .year(2026)
            .user(user)
            .category(category)
            .build();

        alertHelper.checkAndNotify(limit, new BigDecimal("90"), new BigDecimal("100"));

        verify(notificationService).createIfNotRecent(
            eq(user),
            eq(NotificationType.ALERT),
            eq("Superaste el límite de Ocio este mes ($100 / $100)."),
            eq(200L),
            eq(23)
        );
    }

    @Test
    void checkAndNotify_crosses50And75_andIgnoresInvalidLimit() {
        User user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("a@example.com").password("x").verified(true).build();
        SpendingLimit noCategory = SpendingLimit.builder()
            .id(3L).amountLimit(new BigDecimal("100")).user(user).build();
        alertHelper.checkAndNotify(noCategory, new BigDecimal("40"), new BigDecimal("80"));
        verify(notificationService).createIfNotRecent(
            eq(user), eq(NotificationType.ALERT),
            org.mockito.ArgumentMatchers.contains("50%"), eq(30L + 50), eq(23)
        );
        verify(notificationService).createIfNotRecent(
            eq(user), eq(NotificationType.ALERT),
            org.mockito.ArgumentMatchers.contains("75%"), eq(30L + 75), eq(23)
        );

        alertHelper.checkAndNotify(null, BigDecimal.ONE, BigDecimal.TEN);
        alertHelper.checkAndNotify(SpendingLimit.builder().amountLimit(BigDecimal.ZERO).build(),
            BigDecimal.ONE, BigDecimal.TEN);
    }

    @Test
    void notifyHighestIfDue_notifiesTopThreshold() {
        User user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("a@example.com").password("x").verified(true).build();
        Category category = Category.builder().id(2L).name("Ocio").type(CategoryType.EXPENSE).user(user).build();
        SpendingLimit limit = SpendingLimit.builder()
            .id(10L).amountLimit(new BigDecimal("100")).currentAmount(new BigDecimal("60"))
            .user(user).category(category).build();
        alertHelper.notifyHighestIfDue(limit);
        verify(notificationService).createIfNotRecent(
            eq(user), eq(NotificationType.ALERT),
            org.mockito.ArgumentMatchers.contains("50%"), eq(150L), eq(23)
        );

        alertHelper.notifyHighestIfDue(SpendingLimit.builder()
            .amountLimit(new BigDecimal("100")).currentAmount(new BigDecimal("10")).build());
    }
}
