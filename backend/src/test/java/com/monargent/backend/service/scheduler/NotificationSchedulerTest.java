package com.monargent.backend.service.scheduler;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.entity.CalendarEvent;
import com.monargent.backend.entity.FixedExpense;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.GroupLifecycleStatus;
import com.monargent.backend.enums.NotificationType;
import com.monargent.backend.repository.CalendarEventRepository;
import com.monargent.backend.repository.FixedExpenseRepository;
import com.monargent.backend.repository.GroupExpenseRepository;
import com.monargent.backend.repository.GroupGuestMemberRepository;
import com.monargent.backend.repository.GroupRepository;
import com.monargent.backend.repository.GroupSettlementPaymentRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.NotificationService;
import com.monargent.backend.service.SpendingLimitAlertHelper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationSchedulerTest {

    @Mock private FixedExpenseRepository fixedExpenseRepository;
    @Mock private CalendarEventRepository calendarEventRepository;
    @Mock private SpendingLimitRepository spendingLimitRepository;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupExpenseRepository groupExpenseRepository;
    @Mock private GroupGuestMemberRepository groupGuestMemberRepository;
    @Mock private GroupSettlementPaymentRepository settlementPaymentRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private SpendingLimitAlertHelper spendingLimitAlertHelper;

    @InjectMocks
    private NotificationScheduler scheduler;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Ana").lastname("Perez")
            .email("ana@example.com").password("x").verified(true).build();
    }

    @Test
    void sendFixedExpenseReminders_whenDueInFiveDays() {
        LocalDate today = LocalDate.now();
        int dueDay = today.plusDays(5).getDayOfMonth();
        FixedExpense expense = FixedExpense.builder()
            .id(9L).title("Alquiler").dueDay(dueDay).user(user).active(true).build();
        when(fixedExpenseRepository.findByActiveTrue()).thenReturn(List.of(expense));

        scheduler.sendFixedExpenseReminders();
        verify(notificationService).createIfNotRecent(
            eq(user), eq(NotificationType.REMINDER), anyString(), eq(9L * 10 + 5), eq(23));
    }

    @Test
    void sendCalendarEventReminders_andHourReminders() {
        LocalDate today = LocalDate.now();
        LocalDate target = today.plusDays(3);
        CalendarEvent event = CalendarEvent.builder()
            .id(4L).title("Cumple").month(target.getMonthValue()).day(target.getDayOfMonth())
            .eventHour(LocalDateTime.now().plusHours(12).getHour()).user(user).active(true).build();
        when(calendarEventRepository.findByActiveTrue()).thenReturn(List.of(event));

        scheduler.sendCalendarEventReminders();
        verify(notificationService).createIfNotRecent(
            eq(user), eq(NotificationType.REMINDER), anyString(), eq(4L * 10 + 3), eq(23));

        scheduler.sendCalendarEventHourReminders();
    }

    @Test
    void sendSpendingLimitAlerts_andGroupDebtReminders() {
        SpendingLimit limit = SpendingLimit.builder().id(1L).build();
        when(spendingLimitRepository.findAll()).thenReturn(List.of(limit));
        scheduler.sendSpendingLimitAlerts();
        verify(spendingLimitAlertHelper).notifyHighestIfDue(limit);

        User debtor = user;
        User creditor = User.builder().id(2L).name("Bob").lastname("Lopez")
            .email("bob@example.com").password("x").verified(true).mpAlias("bob.mp").build();
        Group group = Group.builder().id(10L).title("Asado")
            .lifecycleStatus(GroupLifecycleStatus.SETTLEMENT)
            .members(new HashSet<>(Set.of(debtor, creditor))).build();
        GroupExpense expense = GroupExpense.builder()
            .id(1L).group(group).title("Todo").amount(new BigDecimal("100"))
            .paidBy(creditor).date(LocalDateTime.now()).build();
        when(userRepository.findAll()).thenReturn(List.of(debtor));
        when(groupRepository.findAllByMemberId(1L)).thenReturn(List.of(group));
        when(groupGuestMemberRepository.findAllByGroupId(10L)).thenReturn(List.of());
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of(expense));
        when(settlementPaymentRepository.findAllByGroupId(10L)).thenReturn(List.of());

        scheduler.sendGroupDebtReminders();
        verify(notificationService).createIfNotRecent(
            eq(debtor), eq(NotificationType.PAYMENT), anyString(), eq(null), eq(24));
    }
}
