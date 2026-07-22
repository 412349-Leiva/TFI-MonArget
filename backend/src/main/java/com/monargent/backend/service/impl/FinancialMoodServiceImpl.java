package com.monargent.backend.service.impl;

import com.monargent.backend.dto.profile.FinancialMoodFactorResponse;
import com.monargent.backend.dto.profile.FinancialMoodResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.FinancialMoodFactorTier;
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
   * Puntaje total: 100 pts (modelo híbrido, 25% por factor)
   * | Factor                    | Peso |
   * | Ritmo de gasto / ahorro   | 25%  |
   * | Gastos grupales           | 25%  |
   * | Objetivos financieros     | 25%  |
   * | Límites de gasto          | 25%  |
   *
   * Ritmo de gasto: % del ingreso ya gastado vs. avance del mes
   * (no se contempla gastar más de lo que entró).
   *
   * Carita (según puntaje ponderado + reglas de dominio):
   *   0–39  NEEDS_ATTENTION (rojo)
   *   40–69 ON_TRACK (amarillo)
   *   70–100 HEALTHY (verde)
   *
   * Reglas de dominio (post-puntaje):
   *   - Balance negativo en el mes → tope ON_TRACK (69), no puede ser HEALTHY.
   *   - 2+ límites de gasto superados → tope ON_TRACK (69).
   */
  private static final int WEIGHT_INCOME_BALANCE = 25;
  private static final int WEIGHT_GROUP_EXPENSES = 25;
  private static final int WEIGHT_GOALS = 25;
  private static final int WEIGHT_LIMITS = 25;
  private static final int ON_TRACK_MAX_SCORE = 69;
  private static final BigDecimal GROUP_DEBT_LOW_THRESHOLD = new BigDecimal("15000");

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

    BigDecimal income = nullSafe(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
        userId, month, year, TransactionType.INCOME));
    BigDecimal expenses = nullSafe(transactionRepository.sumAmountByUserAndMonthAndYearAndType(
        userId, month, year, TransactionType.EXPENSE));

    BigDecimal balance = income.subtract(expenses);
    long limitsExceeded = countExceededLimits(userId, month, year);

    List<FinancialMoodFactorResponse> factors = new ArrayList<>();
    factors.add(scoreIncomeBalance(income, expenses, today));
    factors.add(scoreGroupExpenses(userId, memberKey));
    factors.add(scoreGoals(userId));
    factors.add(scoreLimits(userId, month, year, limitsExceeded));

    int rawScore = factors.stream().mapToInt(FinancialMoodFactorResponse::getPoints).sum();
    int score = applyDomainRules(rawScore, balance, limitsExceeded);
    FinancialMoodLevel level = resolveLevel(score);

    return FinancialMoodResponse.builder()
        .level(level)
        .score(score)
        .maxScore(100)
        .statusTitle(resolveStatusTitle(level))
        .statusDescription(resolveStatusDescription(level))
        .factors(factors)
        .month(month)
        .year(year)
        .build();
  }

  /**
   * Evalúa cuánto del ingreso ya se gastó respecto al avance del mes.
   * Ejemplo: a mitad de mes, gastar ~70% y quedar con ~30% se considera mal (va muy acelerado).
   * Gastar más de lo que entró suma 0: no tiene sentido de dónde sale esa plata.
   */
  private FinancialMoodFactorResponse scoreIncomeBalance(
      BigDecimal income, BigDecimal expenses, LocalDate today) {
    int points;
    String detail;
    FinancialMoodFactorTier tier;

    if (income.compareTo(BigDecimal.ZERO) <= 0) {
      if (expenses.compareTo(BigDecimal.ZERO) > 0) {
        points = 0;
        tier = FinancialMoodFactorTier.LOW;
        detail = "Registraste gastos sin ingresos este mes. ¿Con qué plata los cubrís?";
      } else {
        points = 13;
        tier = FinancialMoodFactorTier.MEDIUM;
        detail = "Todavía no hay movimientos registrados este mes.";
      }
      return factor("INCOME_BALANCE", "Ritmo de gasto", WEIGHT_INCOME_BALANCE, points, tier, detail);
    }

    if (expenses.compareTo(income) > 0) {
      return factor(
          "INCOME_BALANCE",
          "Ritmo de gasto",
          WEIGHT_INCOME_BALANCE,
          0,
          FinancialMoodFactorTier.LOW,
          "Este mes gastaste más de lo que entró. Eso no cierra: ¿de dónde sale esa plata?"
      );
    }

    if (expenses.compareTo(BigDecimal.ZERO) <= 0) {
      return factor(
          "INCOME_BALANCE",
          "Ritmo de gasto",
          WEIGHT_INCOME_BALANCE,
          25,
          FinancialMoodFactorTier.GOOD,
          "Tenés ingresos este mes y todavía no registraste gastos."
      );
    }

    BigDecimal spendPctBd = expenses
        .divide(income, 4, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100));
    int spendPct = spendPctBd.setScale(0, RoundingMode.HALF_UP).intValue();
    int remainingPct = Math.max(0, 100 - spendPct);

    BigDecimal monthProgress = BigDecimal.valueOf(today.getDayOfMonth())
        .divide(BigDecimal.valueOf(today.lengthOfMonth()), 4, RoundingMode.HALF_UP);
    // % esperado si gastaras lo que entra de forma pareja a lo largo del mes
    BigDecimal linearExpectedSpendPct = monthProgress.multiply(BigDecimal.valueOf(100));
    // Umbral "acelerado": ~40% por encima del ritmo lineal (mitad de mes ≈ 70%)
    BigDecimal rushedThreshold = linearExpectedSpendPct
        .multiply(new BigDecimal("1.40"))
        .min(BigDecimal.valueOf(100));

    if (spendPctBd.compareTo(rushedThreshold) >= 0) {
      points = 0;
      tier = FinancialMoodFactorTier.LOW;
      detail = "Gastaste el " + spendPct + "% de tus ingresos y te queda el " + remainingPct
          + "%. A esta altura del mes vas muy acelerado.";
    } else if (spendPctBd.compareTo(linearExpectedSpendPct) > 0) {
      points = 9;
      tier = FinancialMoodFactorTier.MEDIUM;
      detail = "Gastaste el " + spendPct + "% de tus ingresos (te queda el " + remainingPct
          + "%). Vas un poco adelantado para esta altura del mes.";
    } else if (spendPctBd.compareTo(linearExpectedSpendPct.multiply(new BigDecimal("0.70"))) <= 0) {
      points = 25;
      tier = FinancialMoodFactorTier.GOOD;
      detail = "Gastaste el " + spendPct + "% de tus ingresos y te queda el " + remainingPct
          + "%. Vas a buen ritmo de ahorro para esta altura del mes.";
    } else {
      points = 19;
      tier = FinancialMoodFactorTier.GOOD;
      detail = "Gastaste el " + spendPct + "% de tus ingresos y te queda el " + remainingPct
          + "%. El ritmo va bien.";
    }

    return factor("INCOME_BALANCE", "Ritmo de gasto", WEIGHT_INCOME_BALANCE, points, tier, detail);
  }

  private FinancialMoodFactorResponse scoreGroupExpenses(Long userId, String memberKey) {
    BigDecimal owedByMe = BigDecimal.ZERO;
    boolean owedToMe = false;

    for (Group group : groupRepository.findAllByMemberId(userId)) {
      if (group.getLifecycleStatus() != GroupLifecycleStatus.SETTLEMENT) {
        continue;
      }
      Set<String> paidKeys = loadPaidSettlementKeys(group.getId());
      for (Transfer transfer : computeTransfers(group)) {
        String key = settlementKey(transfer.getFromMemberKey(), transfer.getToMemberKey());
        if (paidKeys.contains(key)) {
          continue;
        }
        if (memberKey.equals(transfer.getFromMemberKey())) {
          owedByMe = owedByMe.add(transfer.getAmount());
        }
        if (memberKey.equals(transfer.getToMemberKey())) {
          owedToMe = true;
        }
      }
    }

    int points;
    String detail;
    FinancialMoodFactorTier tier;

    if (owedByMe.compareTo(BigDecimal.ZERO) <= 0) {
      points = 25;
      tier = FinancialMoodFactorTier.GOOD;
      detail = owedToMe
          ? "No debés en grupos y tenés pagos pendientes a tu favor."
          : "No tenés deudas pendientes en gastos grupales.";
    } else if (owedByMe.compareTo(GROUP_DEBT_LOW_THRESHOLD) < 0) {
      points = 13;
      tier = FinancialMoodFactorTier.MEDIUM;
      detail = "Debés " + formatMoney(owedByMe) + " en liquidaciones de grupos (monto bajo).";
    } else {
      points = 0;
      tier = FinancialMoodFactorTier.LOW;
      detail = "Debés " + formatMoney(owedByMe) + " en liquidaciones de grupos (monto considerable).";
    }

    return factor("GROUP_EXPENSES", "Gastos grupales", WEIGHT_GROUP_EXPENSES, points, tier, detail);
  }

  private FinancialMoodFactorResponse scoreGoals(Long userId) {
    List<SavingGoal> activeGoals = savingGoalRepository.findAllByUserId(userId).stream()
        .filter(goal -> goal.getStatus() == SavingGoalStatus.ACTIVE)
        .filter(goal -> goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0)
        .toList();

    if (activeGoals.isEmpty()) {
      return factor(
          "GOALS",
          "Objetivos financieros",
          WEIGHT_GOALS,
          13,
          FinancialMoodFactorTier.MEDIUM,
          "No tenés objetivos de ahorro activos."
      );
    }

    BigDecimal totalProgress = BigDecimal.ZERO;
    for (SavingGoal goal : activeGoals) {
      BigDecimal ratio = goal.getCurrentAmount()
          .divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
          .multiply(BigDecimal.valueOf(100));
      totalProgress = totalProgress.add(ratio);
    }
    int avgProgress = totalProgress
        .divide(BigDecimal.valueOf(activeGoals.size()), 0, RoundingMode.HALF_UP)
        .intValue();

    int points;
    FinancialMoodFactorTier tier;
    if (avgProgress >= 80) {
      points = 25;
      tier = FinancialMoodFactorTier.GOOD;
    } else if (avgProgress >= 40) {
      points = 13;
      tier = FinancialMoodFactorTier.MEDIUM;
    } else {
      points = 0;
      tier = FinancialMoodFactorTier.LOW;
    }

    String detail = "Progreso promedio de tus objetivos: " + avgProgress + "%.";
    return factor("GOALS", "Objetivos financieros", WEIGHT_GOALS, points, tier, detail);
  }

  private long countExceededLimits(Long userId, int month, int year) {
    return spendingLimitRepository.findAllByUserId(userId).stream()
        .filter(limit -> limit.getMonth().equals(month) && limit.getYear().equals(year))
        .filter(this::isLimitExceeded)
        .count();
  }

  private FinancialMoodFactorResponse scoreLimits(Long userId, int month, int year, long exceeded) {
    List<SpendingLimit> monthLimits = spendingLimitRepository.findAllByUserId(userId).stream()
        .filter(limit -> limit.getMonth().equals(month) && limit.getYear().equals(year))
        .toList();

    if (monthLimits.isEmpty()) {
      return factor(
          "LIMITS",
          "Límites de gasto",
          WEIGHT_LIMITS,
          25,
          FinancialMoodFactorTier.GOOD,
          "No configuraste límites de gasto este mes."
      );
    }

    int points;
    FinancialMoodFactorTier tier;
    String detail;

    if (exceeded == 0) {
      points = 25;
      tier = FinancialMoodFactorTier.GOOD;
      detail = "Ningún límite de gasto fue superado este mes.";
    } else if (exceeded == 1) {
      points = 13;
      tier = FinancialMoodFactorTier.MEDIUM;
      detail = "Superaste 1 límite de gasto este mes.";
    } else {
      points = 0;
      tier = FinancialMoodFactorTier.LOW;
      detail = "Superaste " + exceeded + " límites de gasto este mes.";
    }

    return factor("LIMITS", "Límites de gasto", WEIGHT_LIMITS, points, tier, detail);
  }

  /**
   * Aplica reglas de dominio sobre el puntaje ponderado. El tope ON_TRACK (69) impide
   * clasificar como HEALTHY cuando el balance del mes es negativo o hay 2+ límites superados.
   */
  private int applyDomainRules(int rawScore, BigDecimal balance, long limitsExceeded) {
    int score = rawScore;
    if (balance.compareTo(BigDecimal.ZERO) < 0 && score > ON_TRACK_MAX_SCORE) {
      score = ON_TRACK_MAX_SCORE;
    }
    if (limitsExceeded >= 2 && score > ON_TRACK_MAX_SCORE) {
      score = ON_TRACK_MAX_SCORE;
    }
    return score;
  }

  private FinancialMoodFactorResponse factor(
      String key,
      String label,
      int maxPoints,
      int points,
      FinancialMoodFactorTier tier,
      String detail
  ) {
    return FinancialMoodFactorResponse.builder()
        .key(key)
        .label(label)
        .maxPoints(maxPoints)
        .points(points)
        .tier(tier)
        .detail(detail)
        .build();
  }

  private FinancialMoodLevel resolveLevel(int score) {
    if (score >= 70) {
      return FinancialMoodLevel.HEALTHY;
    }
    if (score >= 40) {
      return FinancialMoodLevel.ON_TRACK;
    }
    return FinancialMoodLevel.NEEDS_ATTENTION;
  }

  private String resolveStatusTitle(FinancialMoodLevel level) {
    return switch (level) {
      case HEALTHY -> "Salud financiera";
      case ON_TRACK -> "En camino";
      case NEEDS_ATTENTION -> "Necesita atención";
    };
  }

  private String resolveStatusDescription(FinancialMoodLevel level) {
    return switch (level) {
      case HEALTHY ->
          "¡Vas por buen camino! Mantenés un buen equilibrio entre ingresos y gastos, "
              + "respetás tus límites, avanzás en tus objetivos y tu situación en los gastos "
              + "grupales es favorable o estable.";
      case ON_TRACK ->
          "Tus finanzas están relativamente equilibradas, aunque todavía hay aspectos por mejorar. "
              + "Reducir gastos innecesarios, controlar los límites y avanzar en tus objetivos "
              + "te ayudará a mejorar tu salud financiera.";
      case NEEDS_ATTENTION ->
          "Tu situación financiera requiere atención. Es posible que estés gastando más de lo "
              + "que ingresás, tengás deudas pendientes, hayas superado varios límites de gasto "
              + "o estés avanzando poco en tus objetivos financieros.";
    };
  }

  private boolean isLimitExceeded(SpendingLimit limit) {
    if (limit.getAmountLimit().compareTo(BigDecimal.ZERO) <= 0) {
      return false;
    }
    return limit.getCurrentAmount().compareTo(limit.getAmountLimit()) > 0;
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
      String displayName = fullName(member);
      participants.add(Participant.builder()
          .memberKey(key)
          .nick(displayName)
          .mpAlias(member.getMpAlias())
          .paid(spentByMember.getOrDefault(key, BigDecimal.ZERO))
          .currentUser(false)
          .build());
    }
    for (GroupGuestMember guest : guests) {
      String key = "guest-" + guest.getId();
      participants.add(Participant.builder()
          .memberKey(key)
          .nick(guest.getDisplayName())
          .mpAlias(guest.getMpAlias())
          .paid(spentByMember.getOrDefault(key, BigDecimal.ZERO))
          .currentUser(false)
          .build());
    }

    return GroupSettlementCalculator.compute(participants);
  }

  private String fullName(User user) {
    String first = user.getName() != null ? user.getName().trim() : "";
    String last = user.getLastname() != null ? user.getLastname().trim() : "";
    String full = (first + " " + last).trim();
    return full.isBlank() ? user.getEmail() : full;
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
