package com.monargent.backend.service.impl;

import com.monargent.backend.dto.profile.FinancialMoodItemResponse;
import com.monargent.backend.dto.profile.FinancialMoodResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.FinancialMoodLevel;
import com.monargent.backend.enums.GroupLifecycleStatus;
import com.monargent.backend.enums.SavingGoalStatus;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.repository.GroupExpenseRepository;
import com.monargent.backend.repository.GroupGuestMemberRepository;
import com.monargent.backend.repository.GroupRepository;
import com.monargent.backend.repository.GroupSettlementPaymentRepository;
import com.monargent.backend.repository.SavingGoalRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.FinancialMoodService;
import com.monargent.backend.service.group.GroupSettlementCalculator;
import com.monargent.backend.service.group.GroupSettlementCalculator.Participant;
import com.monargent.backend.service.group.GroupSettlementCalculator.Transfer;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinancialMoodServiceImpl implements FinancialMoodService {

    /*
     * Financial mood ("caritas") — multiple levels can appear at once.
     * Each non-empty bucket becomes one item in the response; the UI shows every icon.
     *
     * | Level  | Trigger |
     * |--------|---------|
     * | ANGRY  | Unpaid group settlement: someone owes YOU in a group in SETTLEMENT phase. |
     * | SAD    | You owe someone in SETTLEMENT (unpaid), OR any spending limit for the current month is >= 70% used. |
     * | YELLOW | Active saving goal: this month's deposits are < 80% of last month's (only if last month had deposits). |
     * | HAPPY  | Active goal progress >= 70% of target, OR (no group debts AND expenses <= 70% of income this month). |
     * | OK     | Shown only when HAPPY is empty: all current-month limits exist and stay below 70%, OR generic "no alerts" fallback. |
     *
     * Priority for response.level (legacy single field): first item in order ANGRY → SAD → YELLOW → HAPPY → OK.
     */
    private static final BigDecimal LIMIT_WARN_RATIO = new BigDecimal("0.70");
    private static final BigDecimal GOAL_WEAK_RATIO = new BigDecimal("0.80");
    private static final BigDecimal HAPPY_EXPENSE_RATIO = new BigDecimal("0.70");
    private static final BigDecimal HAPPY_GOAL_PROGRESS = new BigDecimal("0.70");

    private final CurrentUserService currentUserService;
    private final GroupRepository groupRepository;
    private final GroupExpenseRepository groupExpenseRepository;
    private final GroupGuestMemberRepository groupGuestMemberRepository;
    private final GroupSettlementPaymentRepository settlementPaymentRepository;
    private final SpendingLimitRepository spendingLimitRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final TransactionRepository transactionRepository;

    @Override
    public FinancialMoodResponse getCurrentMonthMood() {
        User user = currentUserService.getCurrentUser();
        Long userId = user.getId();
        LocalDate today = LocalDate.now();
        int month = today.getMonthValue();
        int year = today.getYear();

        String memberKey = "user-" + userId;

        List<String> angryMsgs = new ArrayList<>();
        List<String> sadMsgs = new ArrayList<>();
        List<String> yellowMsgs = new ArrayList<>();
        List<String> happyMsgs = new ArrayList<>();

        boolean owedToMe = collectGroupCreditorMessages(userId, memberKey, angryMsgs);
        boolean iOwe = collectGroupDebtorMessages(userId, memberKey, sadMsgs);
        collectLimitMessages(userId, month, year, sadMsgs);
        collectWeakGoalMessages(userId, month, year, yellowMsgs);
        collectGoalHappyMessages(userId, happyMsgs);

        BigDecimal income = nullSafe(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            userId, month, year, TransactionType.INCOME));
        BigDecimal expenses = nullSafe(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            userId, month, year, TransactionType.EXPENSE));

        boolean expensesHealthy = income.compareTo(BigDecimal.ZERO) > 0
            && expenses.divide(income, 4, RoundingMode.HALF_UP).compareTo(HAPPY_EXPENSE_RATIO) <= 0;
        boolean noGroupDebts = !owedToMe && !iOwe;
        if (expensesHealthy && noGroupDebts && happyMsgs.isEmpty()) {
            happyMsgs.add("Gastaste menos del 70% de tus ingresos este mes.");
        }

        List<SpendingLimit> monthLimits = spendingLimitRepository.findAllByUserId(userId).stream()
            .filter(limit -> limit.getMonth().equals(month) && limit.getYear().equals(year))
            .toList();
        boolean limitsHealthy = !monthLimits.isEmpty() && monthLimits.stream().noneMatch(this::isLimitHigh);

        List<FinancialMoodItemResponse> items = new ArrayList<>();
        if (!angryMsgs.isEmpty()) {
            items.add(FinancialMoodItemResponse.builder()
                .level(FinancialMoodLevel.ANGRY)
                .messages(List.copyOf(angryMsgs))
                .build());
        }
        if (!sadMsgs.isEmpty()) {
            items.add(FinancialMoodItemResponse.builder()
                .level(FinancialMoodLevel.SAD)
                .messages(List.copyOf(sadMsgs))
                .build());
        }
        if (!yellowMsgs.isEmpty()) {
            items.add(FinancialMoodItemResponse.builder()
                .level(FinancialMoodLevel.YELLOW)
                .messages(List.copyOf(yellowMsgs))
                .build());
        }
        if (!happyMsgs.isEmpty()) {
            items.add(FinancialMoodItemResponse.builder()
                .level(FinancialMoodLevel.HAPPY)
                .messages(List.copyOf(happyMsgs))
                .build());
        } else if (limitsHealthy && sadMsgs.isEmpty() && angryMsgs.isEmpty() && yellowMsgs.isEmpty()) {
            items.add(FinancialMoodItemResponse.builder()
                .level(FinancialMoodLevel.OK)
                .messages(List.of("Tus límites de gasto van bien este mes."))
                .build());
        }
        if (items.isEmpty()) {
            items.add(FinancialMoodItemResponse.builder()
                .level(FinancialMoodLevel.OK)
                .messages(List.of("Sin alertas este mes. Seguí así."))
                .build());
        }

        FinancialMoodLevel level = items.get(0).getLevel();

        return FinancialMoodResponse.builder()
            .level(level)
            .items(items)
            .month(month)
            .year(year)
            .build();
    }

    private boolean collectGroupCreditorMessages(Long userId, String memberKey, List<String> messages) {
        boolean found = false;
        for (Group group : groupRepository.findAllByMemberId(userId)) {
            if (group.getLifecycleStatus() != GroupLifecycleStatus.SETTLEMENT) {
                continue;
            }
            Set<String> paidKeys = loadPaidSettlementKeys(group.getId());
            for (Transfer transfer : computeTransfers(group)) {
                if (!memberKey.equals(transfer.getToMemberKey())) {
                    continue;
                }
                String key = settlementKey(transfer.getFromMemberKey(), transfer.getToMemberKey());
                if (paidKeys.contains(key)) {
                    continue;
                }
                found = true;
                messages.add(transfer.getFromNick() + " te debe " + formatMoney(transfer.getAmount())
                    + " de \"" + group.getTitle() + "\"");
            }
        }
        return found;
    }

    private boolean collectGroupDebtorMessages(Long userId, String memberKey, List<String> messages) {
        boolean found = false;
        for (Group group : groupRepository.findAllByMemberId(userId)) {
            if (group.getLifecycleStatus() != GroupLifecycleStatus.SETTLEMENT) {
                continue;
            }
            Set<String> paidKeys = loadPaidSettlementKeys(group.getId());
            for (Transfer transfer : computeTransfers(group)) {
                if (!memberKey.equals(transfer.getFromMemberKey())) {
                    continue;
                }
                String key = settlementKey(transfer.getFromMemberKey(), transfer.getToMemberKey());
                if (paidKeys.contains(key)) {
                    continue;
                }
                found = true;
                messages.add("Le debés " + formatMoney(transfer.getAmount()) + " a "
                    + transfer.getToNick() + " de \"" + group.getTitle() + "\"");
            }
        }
        return found;
    }

    private boolean collectLimitMessages(Long userId, int month, int year, List<String> messages) {
        boolean found = false;
        for (SpendingLimit limit : spendingLimitRepository.findAllByUserId(userId)) {
            if (!limit.getMonth().equals(month) || !limit.getYear().equals(year)) {
                continue;
            }
            if (!isLimitHigh(limit)) {
                continue;
            }
            found = true;
            int pct = percent(limit.getCurrentAmount(), limit.getAmountLimit());
            messages.add("Llevás el " + pct + "% del límite de " + limit.getCategory().getName());
        }
        return found;
    }

    private boolean collectWeakGoalMessages(Long userId, int month, int year, List<String> messages) {
        YearMonth current = YearMonth.of(year, month);
        YearMonth previous = current.minusMonths(1);
        boolean found = false;

        for (SavingGoal goal : savingGoalRepository.findAllByUserId(userId)) {
            if (goal.getStatus() != SavingGoalStatus.ACTIVE) {
                continue;
            }
            String depositTitle = "Depósito objetivo: " + goal.getTitle();
            BigDecimal currentDeposits = nullSafe(transactionRepository.sumAmountByUserAndMonthAndYearAndTitle(
                userId, current.getMonthValue(), current.getYear(), depositTitle));
            BigDecimal previousDeposits = nullSafe(transactionRepository.sumAmountByUserAndMonthAndYearAndTitle(
                userId, previous.getMonthValue(), previous.getYear(), depositTitle));

            if (previousDeposits.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal threshold = previousDeposits.multiply(GOAL_WEAK_RATIO);
            if (currentDeposits.compareTo(threshold) >= 0) {
                continue;
            }
            found = true;
            int dropPct = previousDeposits.subtract(currentDeposits)
                .multiply(BigDecimal.valueOf(100))
                .divide(previousDeposits, 0, RoundingMode.HALF_UP)
                .intValue();
            messages.add("Depositaste un " + dropPct + "% menos para " + goal.getTitle()
                + " que el mes pasado");
        }
        return found;
    }

    private void collectGoalHappyMessages(Long userId, List<String> messages) {
        for (SavingGoal goal : savingGoalRepository.findAllByUserId(userId)) {
            if (goal.getStatus() != SavingGoalStatus.ACTIVE) {
                continue;
            }
            if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal ratio = goal.getCurrentAmount().divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP);
            if (ratio.compareTo(HAPPY_GOAL_PROGRESS) < 0) {
                continue;
            }
            int pct = ratio.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
            messages.add("Llevás el " + pct + "% de " + goal.getTitle());
        }
    }

    private boolean isLimitHigh(SpendingLimit limit) {
        if (limit.getAmountLimit().compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        BigDecimal ratio = limit.getCurrentAmount().divide(limit.getAmountLimit(), 4, RoundingMode.HALF_UP);
        return ratio.compareTo(LIMIT_WARN_RATIO) >= 0;
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

    private Set<String> loadPaidSettlementKeys(Long groupId) {
        Set<String> keys = new HashSet<>();
        settlementPaymentRepository.findAllByGroupId(groupId).forEach(payment -> {
            if (payment.isConfirmed()) {
                keys.add(settlementKey(payment.getFromMemberKey(), payment.getToMemberKey()));
            }
        });
        return keys;
    }

    private String settlementKey(String from, String to) {
        return from + "->" + to;
    }

    private int percent(BigDecimal current, BigDecimal limit) {
        return current.multiply(BigDecimal.valueOf(100))
            .divide(limit, 0, RoundingMode.HALF_UP)
            .intValue();
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String formatMoney(BigDecimal amount) {
        NumberFormat formatter = NumberFormat.getNumberInstance(Locale.forLanguageTag("es-AR"));
        formatter.setMaximumFractionDigits(0);
        formatter.setMinimumFractionDigits(0);
        return "$" + formatter.format(amount.setScale(0, RoundingMode.HALF_UP));
    }
}
