package com.monargent.backend.service.impl;

import com.monargent.backend.dto.recommendation.RecommendationResponse;
import com.monargent.backend.entity.Recommendation;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.Transaction;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.RecommendationType;
import com.monargent.backend.enums.SavingGoalStatus;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.AiServiceUnavailableException;
import com.monargent.backend.repository.RecommendationRepository;
import com.monargent.backend.repository.SavingGoalRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.RecommendationService;
import com.monargent.backend.service.ai.AiCompletionClient;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RecommendationServiceImpl implements RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final TransactionRepository transactionRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final SpendingLimitRepository spendingLimitRepository;
    private final CurrentUserService currentUserService;
    private final AiCompletionClient aiCompletionClient;

    @Override
    @Transactional(readOnly = true)
    public List<RecommendationResponse> findAll() {
        return recommendationRepository.findAllByUserIdOrderByCreatedAtDesc(currentUserService.getCurrentUserId())
            .stream().map(this::toResponse).toList();
    }

    @Override
    public List<RecommendationResponse> generate() {
        User user = currentUserService.getCurrentUser();
        Long userId = user.getId();

        LocalDate from = LocalDate.now().minusDays(60);
        List<Transaction> transactions = transactionRepository.findAllByUserId(userId).stream()
            .filter(t -> t.getDate() != null && !t.getDate().toLocalDate().isBefore(from))
            .toList();

        List<SavingGoal> goals = savingGoalRepository.findAllByUserId(userId).stream()
            .filter(g -> g.getStatus() == SavingGoalStatus.ACTIVE)
            .toList();

        List<SpendingLimit> limits = spendingLimitRepository.findAllByUserId(userId).stream()
            .filter(l -> l.getMonth() == LocalDate.now().getMonthValue()
                && l.getYear() == LocalDate.now().getYear())
            .toList();

        String context = buildContext(transactions, goals, limits);
        String geminiResponse = callGemini(context);

        recommendationRepository.deleteAllByUserId(userId);

        List<Recommendation> saved = parseAndSaveRecommendations(geminiResponse, user);
        if (saved.isEmpty()) {
            saved = buildFallbackRecommendations(transactions, goals, limits, user);
        }
        return saved.stream().map(this::toResponse).toList();
    }

    private String buildContext(List<Transaction> transactions, List<SavingGoal> goals, List<SpendingLimit> limits) {
        StringBuilder sb = new StringBuilder();
        sb.append("Datos financieros del usuario (últimos 60 días):\n\n");

        if (transactions.isEmpty()) {
            sb.append("- Sin transacciones recientes.\n");
        } else {
            Map<String, BigDecimal> expensesByCategory = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                    t -> t.getCategory().getName(),
                    Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));
            sb.append("Gastos por categoría:\n");
            expensesByCategory.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .forEach(e -> sb.append("- ").append(e.getKey()).append(": $")
                    .append(formatMoney(e.getValue())).append("\n"));
        }

        sb.append("\nObjetivos de ahorro activos:\n");
        if (goals.isEmpty()) {
            sb.append("- Sin objetivos activos.\n");
        } else {
            for (SavingGoal goal : goals) {
                BigDecimal remaining = goal.getTargetAmount().subtract(goal.getCurrentAmount()).max(BigDecimal.ZERO);
                sb.append("- ").append(goal.getTitle())
                    .append(": $").append(formatMoney(goal.getCurrentAmount()))
                    .append(" / $").append(formatMoney(goal.getTargetAmount()))
                    .append(" (faltan $").append(formatMoney(remaining)).append(")\n");
            }
        }

        sb.append("\nLímites de gasto del mes actual:\n");
        if (limits.isEmpty()) {
            sb.append("- Sin límites configurados.\n");
        } else {
            for (SpendingLimit limit : limits) {
                String category = limit.getCategory() != null ? limit.getCategory().getName() : "categoría";
                int pct = percentage(limit.getCurrentAmount(), limit.getAmountLimit());
                sb.append("- ").append(category).append(": $")
                    .append(formatMoney(limit.getCurrentAmount()))
                    .append(" / $").append(formatMoney(limit.getAmountLimit()))
                    .append(" (").append(pct).append("% usado)\n");
            }
        }

        return sb.toString();
    }

    private String callGemini(String context) {
        String systemPrompt = """
            Sos un asesor financiero personal argentino. Generá exactamente 3 recomendaciones en español rioplatense.
            Cada línea debe empezar con el tipo entre corchetes: [SAVINGS], [SPENDING], [GOAL], [ALERT] o [GENERAL].
            Usá montos concretos en pesos ($) basados en los datos del usuario.
            Si hay objetivos de ahorro, incluí al menos una recomendación que diga cuánto podría sumar al objetivo
            si reduce un gasto específico (ej: "Si reducís Uber de $8000 a $5000 podés sumar $3000 a tu objetivo Viajar a Brasil").
            Si hay límites cerca del 50%, 75% o 100%, mencionalo en una alerta.
            Sin numeración ni viñetas extra. Una recomendación por línea.
            """;

        try {
            return aiCompletionClient.complete(systemPrompt, context);
        } catch (AiServiceUnavailableException ex) {
            log.warn("Gemini no disponible, se usarán recomendaciones locales: {}", ex.getMessage());
            return "";
        } catch (RuntimeException ex) {
            log.warn("Error al llamar a Gemini: {}", ex.getMessage());
            return "";
        }
    }

    private List<Recommendation> buildFallbackRecommendations(
        List<Transaction> transactions,
        List<SavingGoal> goals,
        List<SpendingLimit> limits,
        User user
    ) {
        List<Recommendation> result = new ArrayList<>();

        limits.stream()
            .map(l -> Map.entry(l, percentage(l.getCurrentAmount(), l.getAmountLimit())))
            .filter(e -> e.getValue() >= 50)
            .max(Comparator.comparingInt(Map.Entry::getValue))
            .ifPresent(e -> {
                SpendingLimit limit = e.getKey();
                String category = limit.getCategory() != null ? limit.getCategory().getName() : "categoría";
                String msg = e.getValue() >= 100
                    ? "Superaste el límite de " + category + " este mes. Revisá tus gastos en esa categoría."
                    : "Llegaste al " + e.getValue() + "% del límite de " + category
                        + ". Considerá reducir gastos antes de fin de mes.";
                result.add(saveRecommendation(user, RecommendationType.ALERT, msg, null));
            });

        Map<String, BigDecimal> expenses = transactions.stream()
            .filter(t -> t.getType() == TransactionType.EXPENSE)
            .collect(Collectors.groupingBy(
                t -> t.getCategory().getName(),
                Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
            ));

        expenses.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .ifPresent(top -> {
                BigDecimal total = top.getValue();
                BigDecimal reduction = total.multiply(BigDecimal.valueOf(0.2)).setScale(0, RoundingMode.HALF_UP);
                if (reduction.compareTo(BigDecimal.ZERO) <= 0) {
                    return;
                }
                BigDecimal suggested = total.subtract(reduction).max(BigDecimal.ZERO);
                SavingGoal goal = goals.isEmpty() ? null : goals.get(0);
                String msg = goal != null
                    ? "Si reducís " + top.getKey() + " de $" + formatMoney(total)
                        + " a $" + formatMoney(suggested)
                        + " podés sumar $" + formatMoney(reduction)
                        + " a tu objetivo \"" + goal.getTitle() + "\"."
                    : "Tu mayor gasto es " + top.getKey() + " ($" + formatMoney(total)
                        + "). Reducirlo un 20% te liberaría $" + formatMoney(reduction) + " al mes.";
                result.add(saveRecommendation(user, RecommendationType.GOAL, msg, reduction));
            });

        if (result.size() < 3) {
            result.add(saveRecommendation(
                user,
                RecommendationType.GENERAL,
                "Revisá tus gastos fijos y buscá una suscripción o servicio que puedas pausar este mes.",
                null
            ));
        }

        return result.stream().limit(3).toList();
    }

    private List<Recommendation> parseAndSaveRecommendations(String text, User user) {
        List<Recommendation> result = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return result;
        }

        for (String line : text.split("\\r?\\n")) {
            line = line.trim();
            if (line.isBlank()) {
                continue;
            }

            RecommendationType type = RecommendationType.GENERAL;
            if (line.startsWith("[SAVINGS]")) {
                type = RecommendationType.SAVINGS;
            } else if (line.startsWith("[SPENDING]")) {
                type = RecommendationType.SPENDING;
            } else if (line.startsWith("[GOAL]")) {
                type = RecommendationType.GOAL;
            } else if (line.startsWith("[ALERT]")) {
                type = RecommendationType.ALERT;
            }

            String message = line.replaceFirst("^\\[\\w+]\\s*", "");
            if (message.isBlank()) {
                continue;
            }

            result.add(saveRecommendation(user, type, message, null));
        }

        return result;
    }

    private Recommendation saveRecommendation(User user, RecommendationType type, String message, BigDecimal impact) {
        return recommendationRepository.save(Recommendation.builder()
            .user(user)
            .type(type)
            .message(message)
            .estimatedImpact(impact)
            .build());
    }

    private int percentage(BigDecimal current, BigDecimal limit) {
        if (current == null || limit == null || limit.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return current.multiply(BigDecimal.valueOf(100))
            .divide(limit, 0, RoundingMode.HALF_UP)
            .intValue();
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private RecommendationResponse toResponse(Recommendation r) {
        return RecommendationResponse.builder()
            .id(r.getId())
            .type(r.getType())
            .message(r.getMessage())
            .estimatedImpact(r.getEstimatedImpact())
            .createdAt(r.getCreatedAt())
            .build();
    }
}
