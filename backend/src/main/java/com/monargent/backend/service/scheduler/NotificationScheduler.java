package com.monargent.backend.service.scheduler;

import com.monargent.backend.entity.CalendarEvent;
import com.monargent.backend.entity.FixedExpense;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.User;
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
import com.monargent.backend.service.group.GroupSettlementCalculator;
import com.monargent.backend.service.group.GroupSettlementCalculator.Participant;
import com.monargent.backend.service.group.GroupSettlementCalculator.Transfer;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final FixedExpenseRepository fixedExpenseRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final SpendingLimitRepository spendingLimitRepository;
    private final GroupRepository groupRepository;
    private final GroupExpenseRepository groupExpenseRepository;
    private final GroupGuestMemberRepository groupGuestMemberRepository;
    private final GroupSettlementPaymentRepository settlementPaymentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendFixedExpenseReminders() {
        LocalDate today = LocalDate.now();
        for (FixedExpense expense : fixedExpenseRepository.findByActiveTrue()) {
            if (!isReminderDay(today, expense.getDueDay())) {
                continue;
            }
            User user = expense.getUser();
            String message = "\"" + expense.getTitle() + "\" vence en 3 días (día "
                + expense.getDueDay() + ").";
            notificationService.createIfNotRecent(
                user, NotificationType.REMINDER, message, expense.getId(), 23
            );
        }
    }

    @Scheduled(cron = "0 30 9 * * *")
    @Transactional
    public void sendCalendarEventReminders() {
        LocalDate today = LocalDate.now();
        for (CalendarEvent event : calendarEventRepository.findByActiveTrue()) {
            if (!isReminderDayForMonthDay(today, event.getMonth(), event.getDay())) {
                continue;
            }
            User user = event.getUser();
            String kind = event.getEventType().name().equals("BIRTHDAY") ? "el cumple de" : "el evento";
            String message = "En 3 días es " + kind + " " + event.getTitle() + ".";
            notificationService.createIfNotRecent(
                user, NotificationType.REMINDER, message, event.getId(), 23
            );
        }
    }

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void sendSpendingLimitAlerts() {
        for (SpendingLimit limit : spendingLimitRepository.findAll()) {
            if (limit.getAmountLimit() == null
                || limit.getCurrentAmount() == null
                || limit.getCurrentAmount().compareTo(limit.getAmountLimit()) < 0) {
                continue;
            }
            User user = limit.getUser();
            String category = limit.getCategory() != null ? limit.getCategory().getName() : "categoría";
            String message = "Superaste el límite de " + category + " este mes ("
                + formatMoney(limit.getCurrentAmount()) + " / " + formatMoney(limit.getAmountLimit()) + ").";
            notificationService.createIfNotRecent(
                user, NotificationType.ALERT, message, limit.getId(), 23
            );
        }
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void sendGroupDebtReminders() {
        for (User user : userRepository.findAll()) {
            String memberKey = "user-" + user.getId();
            List<Group> groups = groupRepository.findAllByMemberId(user.getId());
            for (Group group : groups) {
                Set<String> paidKeys = loadPaidKeys(group.getId());
                for (Transfer transfer : computeTransfers(group)) {
                    if (!memberKey.equals(transfer.getFromMemberKey())) {
                        continue;
                    }
                    String key = settlementKey(transfer.getFromMemberKey(), transfer.getToMemberKey());
                    if (paidKeys.contains(key)) {
                        continue;
                    }
                    String message = "Recordatorio: debés " + formatMoney(transfer.getAmount())
                        + " a " + transfer.getToNick() + " en \"" + group.getTitle() + "\".";
                    notificationService.createIfNotRecent(
                        user, NotificationType.PAYMENT, message, null, 24
                    );
                }
            }
        }
    }

    private boolean isReminderDay(LocalDate today, int dueDay) {
        return isReminderDayForMonthDay(today, today.getMonthValue(), dueDay);
    }

    private boolean isReminderDayForMonthDay(LocalDate today, int month, int day) {
        LocalDate due = nextDueDateInMonth(today, month, day);
        return due.minusDays(3).equals(today);
    }

    private LocalDate nextDueDateInMonth(LocalDate from, int month, int day) {
        YearMonth ym = YearMonth.of(from.getYear(), month);
        int clampedDay = Math.min(day, ym.lengthOfMonth());
        LocalDate candidate = LocalDate.of(from.getYear(), month, clampedDay);
        if (!candidate.isBefore(from)) {
            return candidate;
        }
        YearMonth nextYear = YearMonth.of(from.getYear() + 1, month);
        return nextYear.atDay(Math.min(day, nextYear.lengthOfMonth()));
    }

    private LocalDate nextDueDate(LocalDate from, int dueDay) {
        YearMonth ym = YearMonth.from(from);
        int day = Math.min(dueDay, ym.lengthOfMonth());
        LocalDate candidate = from.withDayOfMonth(day);
        if (!candidate.isBefore(from)) {
            return candidate;
        }
        YearMonth next = ym.plusMonths(1);
        return next.atDay(Math.min(dueDay, next.lengthOfMonth()));
    }

    private Set<String> loadPaidKeys(Long groupId) {
        Set<String> keys = new HashSet<>();
        settlementPaymentRepository.findAllByGroupId(groupId).forEach(payment ->
            keys.add(settlementKey(payment.getFromMemberKey(), payment.getToMemberKey()))
        );
        return keys;
    }

    private List<Transfer> computeTransfers(Group group) {
        List<GroupGuestMember> guests = groupGuestMemberRepository.findAllByGroupId(group.getId());
        List<GroupExpense> expenses = groupExpenseRepository.findAllByGroupId(group.getId());

        Map<String, BigDecimal> spentByMember = new HashMap<>();
        for (GroupExpense expense : expenses) {
            String key = resolveExpenseMemberKey(expense);
            if (key != null) {
                spentByMember.merge(key, expense.getAmount(), BigDecimal::add);
            }
        }

        List<Participant> participants = new ArrayList<>();
        for (User member : group.getMembers()) {
            String key = "user-" + member.getId();
            participants.add(Participant.builder()
                .memberKey(key)
                .nick(resolveUserNick(member))
                .mpAlias(member.getMpAlias())
                .paid(spentByMember.getOrDefault(key, BigDecimal.ZERO))
                .currentUser(false)
                .build());
        }
        for (GroupGuestMember guest : guests) {
            String key = "guest-" + guest.getId();
            participants.add(Participant.builder()
                .memberKey(key)
                .nick(guest.getMpAlias())
                .mpAlias(guest.getMpAlias())
                .paid(spentByMember.getOrDefault(key, BigDecimal.ZERO))
                .currentUser(false)
                .build());
        }

        return GroupSettlementCalculator.compute(participants);
    }

    private String resolveExpenseMemberKey(GroupExpense expense) {
        if (expense.getPaidBy() != null) {
            return "user-" + expense.getPaidBy().getId();
        }
        if (expense.getPaidByGuest() != null) {
            return "guest-" + expense.getPaidByGuest().getId();
        }
        return null;
    }

    private String resolveUserNick(User user) {
        if (user.getMpAlias() != null && !user.getMpAlias().isBlank()) {
            return user.getMpAlias().trim();
        }
        String source = user.getName() != null && !user.getName().isBlank()
            ? user.getName()
            : user.getEmail().split("@")[0];
        return source.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_");
    }

    private String settlementKey(String from, String to) {
        return from + "->" + to;
    }

    private String formatMoney(BigDecimal amount) {
        return "$" + amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }
}
