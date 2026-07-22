package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.profile.FinancialMoodFactorResponse;
import com.monargent.backend.dto.profile.FinancialMoodResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FinancialMoodServiceImplTest {

    @Mock private CurrentUserService currentUserService;
    @Mock private GroupRepository groupRepository;
    @Mock private GroupExpenseRepository groupExpenseRepository;
    @Mock private GroupGuestMemberRepository groupGuestMemberRepository;
    @Mock private GroupSettlementPaymentRepository settlementPaymentRepository;
    @Mock private SpendingLimitRepository spendingLimitRepository;
    @Mock private SavingGoalRepository savingGoalRepository;
    @Mock private TransactionRepository transactionRepository;

    @InjectMocks
    private FinancialMoodServiceImpl financialMoodService;

    private User user;
    private int month;
    private int year;

    @BeforeEach
    void setUp() {
        user = User.builder()
            .id(1L)
            .name("Mon")
            .lastname("Argent")
            .email("mood@example.com")
            .password("secret")
            .verified(true)
            .build();
        LocalDate today = LocalDate.now();
        month = today.getMonthValue();
        year = today.getYear();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(groupRepository.findAllByMemberId(1L)).thenReturn(List.of());
        when(savingGoalRepository.findAllByUserId(1L)).thenReturn(List.of());
    }

    @Test
    void getCurrentMonthMood_negativeBalance_capsScoreAt69() {
        // Gastos > ingresos → factor ritmo 0; objetivos casi hechos + sin deudas + sin límites.
        // Balance negativo debe topear el score en 69.
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.INCOME)))
            .thenReturn(new BigDecimal("100"));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.EXPENSE)))
            .thenReturn(new BigDecimal("200"));
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of());
        when(savingGoalRepository.findAllByUserId(1L)).thenReturn(List.of(
            SavingGoal.builder()
                .id(1L)
                .title("Objetivo")
                .targetAmount(new BigDecimal("100"))
                .currentAmount(new BigDecimal("90"))
                .status(SavingGoalStatus.ACTIVE)
                .user(user)
                .build()
        ));

        FinancialMoodResponse response = financialMoodService.getCurrentMonthMood();

        assertThat(response.getScore()).isLessThanOrEqualTo(69);
        assertThat(response.getLevel()).isNotEqualTo(FinancialMoodLevel.HEALTHY);
    }

    @Test
    void getCurrentMonthMood_twoExceededLimits_capsScoreAt69() {
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.INCOME)))
            .thenReturn(new BigDecimal("1000"));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.EXPENSE)))
            .thenReturn(new BigDecimal("100"));
        when(savingGoalRepository.findAllByUserId(1L)).thenReturn(List.of(
            SavingGoal.builder()
                .title("Objetivo")
                .targetAmount(new BigDecimal("100"))
                .currentAmount(new BigDecimal("100"))
                .status(SavingGoalStatus.ACTIVE)
                .user(user)
                .build()
        ));
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of(
            exceededLimit(1L, "50", "100"),
            exceededLimit(2L, "50", "100")
        ));

        FinancialMoodResponse response = financialMoodService.getCurrentMonthMood();

        assertThat(response.getScore()).isLessThanOrEqualTo(69);
        assertThat(response.getLevel()).isNotEqualTo(FinancialMoodLevel.HEALTHY);
    }

    @Test
    void getCurrentMonthMood_noExpensesWithIncome_awards25PacePoints() {
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.INCOME)))
            .thenReturn(new BigDecimal("1000"));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.EXPENSE)))
            .thenReturn(BigDecimal.ZERO);
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of());

        FinancialMoodResponse response = financialMoodService.getCurrentMonthMood();

        FinancialMoodFactorResponse incomeFactor = response.getFactors().stream()
            .filter(f -> "INCOME_BALANCE".equals(f.getKey()))
            .findFirst()
            .orElseThrow();
        assertThat(incomeFactor.getPoints()).isEqualTo(25);
        assertThat(incomeFactor.getLabel()).isEqualTo("Ritmo de gasto");
    }

    @Test
    void getCurrentMonthMood_expensesAboveIncome_awardsZeroPacePoints() {
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.INCOME)))
            .thenReturn(new BigDecimal("100"));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.EXPENSE)))
            .thenReturn(new BigDecimal("150"));
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of());

        FinancialMoodResponse response = financialMoodService.getCurrentMonthMood();

        FinancialMoodFactorResponse incomeFactor = response.getFactors().stream()
            .filter(f -> "INCOME_BALANCE".equals(f.getKey()))
            .findFirst()
            .orElseThrow();
        assertThat(incomeFactor.getPoints()).isEqualTo(0);
        assertThat(incomeFactor.getDetail()).containsIgnoringCase("más de lo que entró");
    }

    @Test
    void getCurrentMonthMood_scoreBands_mapToExpectedLevels() {
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of());

        // HEALTHY: sin gastos (ritmo 25), sin deudas, sin objetivos(13), sin límites → 25+25+13+25=88
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.INCOME)))
            .thenReturn(new BigDecimal("1000"));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.EXPENSE)))
            .thenReturn(BigDecimal.ZERO);
        assertThat(financialMoodService.getCurrentMonthMood().getLevel())
            .isEqualTo(FinancialMoodLevel.HEALTHY);

        // ON_TRACK: gastos > ingresos → ritmo 0 + dominio topea; 0+25+13+25=63
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.INCOME)))
            .thenReturn(new BigDecimal("80"));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.EXPENSE)))
            .thenReturn(new BigDecimal("100"));
        FinancialMoodResponse onTrack = financialMoodService.getCurrentMonthMood();
        assertThat(onTrack.getScore()).isBetween(40, 69);
        assertThat(onTrack.getLevel()).isEqualTo(FinancialMoodLevel.ON_TRACK);

        // NEEDS_ATTENTION: ritmo 0 + objetivo bajo + límites rotos
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.INCOME)))
            .thenReturn(new BigDecimal("50"));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.EXPENSE)))
            .thenReturn(new BigDecimal("100"));
        when(savingGoalRepository.findAllByUserId(1L)).thenReturn(List.of(
            SavingGoal.builder()
                .title("Objetivo bajo")
                .targetAmount(new BigDecimal("100"))
                .currentAmount(new BigDecimal("10"))
                .status(SavingGoalStatus.ACTIVE)
                .user(user)
                .build()
        ));
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of(
            exceededLimit(1L, "10", "100"),
            exceededLimit(2L, "10", "100")
        ));
        FinancialMoodResponse needsAttention = financialMoodService.getCurrentMonthMood();
        assertThat(needsAttention.getScore()).isLessThan(40);
        assertThat(needsAttention.getLevel()).isEqualTo(FinancialMoodLevel.NEEDS_ATTENTION);
    }

    private SpendingLimit exceededLimit(Long id, String limit, String current) {
        return SpendingLimit.builder()
            .id(id)
            .amountLimit(new BigDecimal(limit))
            .currentAmount(new BigDecimal(current))
            .month(month)
            .year(year)
            .user(user)
            .build();
    }

    @Test
    void getCurrentMonthMood_withGroupDebt_scoresGroupFactorBelowMax() {
        User creditor = User.builder().id(2L).name("Bob").lastname("Lopez")
            .email("bob@example.com").password("x").verified(true).build();
        Group group = Group.builder().id(10L).title("Asado")
            .lifecycleStatus(GroupLifecycleStatus.SETTLEMENT)
            .members(new java.util.HashSet<>(java.util.Set.of(user, creditor))).build();
        when(groupRepository.findAllByMemberId(1L)).thenReturn(List.of(group));
        when(groupGuestMemberRepository.findAllByGroupId(10L)).thenReturn(List.of());
        when(groupExpenseRepository.findAllByGroupId(10L)).thenReturn(List.of(
            GroupExpense.builder().id(1L).group(group).title("Todo")
                .amount(new BigDecimal("20000")).paidBy(creditor).build()
        ));
        when(settlementPaymentRepository.findAllByGroupId(10L)).thenReturn(List.of());
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.INCOME)))
            .thenReturn(new BigDecimal("1000"));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.EXPENSE)))
            .thenReturn(new BigDecimal("100"));
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of());

        FinancialMoodResponse response = financialMoodService.getCurrentMonthMood();
        FinancialMoodFactorResponse groupFactor = response.getFactors().stream()
            .filter(f -> "GROUP_EXPENSES".equals(f.getKey()))
            .findFirst()
            .orElseThrow();
        assertThat(groupFactor.getPoints()).isLessThan(25);
    }

    @Test
    void getCurrentMonthMood_openGroupIgnored_andPaidSettlement() {
        Group open = Group.builder().id(11L).title("Abierto")
            .lifecycleStatus(GroupLifecycleStatus.OPEN)
            .members(new java.util.HashSet<>(java.util.Set.of(user))).build();
        when(groupRepository.findAllByMemberId(1L)).thenReturn(List.of(open));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.INCOME)))
            .thenReturn(new BigDecimal("120"));
        when(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
            eq(1L), eq(month), eq(year), eq(TransactionType.EXPENSE)))
            .thenReturn(new BigDecimal("100"));
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of());

        FinancialMoodFactorResponse groupFactor = financialMoodService.getCurrentMonthMood()
            .getFactors().stream()
            .filter(f -> "GROUP_EXPENSES".equals(f.getKey()))
            .findFirst().orElseThrow();
        assertThat(groupFactor.getPoints()).isEqualTo(25);
    }
}
