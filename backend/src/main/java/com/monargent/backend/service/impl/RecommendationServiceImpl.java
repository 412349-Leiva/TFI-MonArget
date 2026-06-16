package com.monargent.backend.service.impl;

import com.monargent.backend.dto.recommendation.RecommendationResponse;
import com.monargent.backend.entity.Recommendation;
import com.monargent.backend.entity.Transaction;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.RecommendationType;
import com.monargent.backend.repository.RecommendationRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.RecommendationService;
import com.monargent.backend.service.ai.AiCompletionClient;
import java.time.LocalDate;
import java.util.ArrayList;
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

        // Fetch recent transactions as context (filter in memory — repository already scoped by user)
        LocalDate from = LocalDate.now().minusDays(60);
        List<Transaction> transactions = transactionRepository.findAllByUserId(userId).stream()
            .filter(t -> t.getDate() != null && !t.getDate().toLocalDate().isBefore(from))
            .toList();

        String summary = buildTransactionSummary(transactions);
        String geminiResponse = callGemini(summary);

        // Clear old recommendations before saving new ones
        recommendationRepository.deleteAllByUserId(userId);

        List<Recommendation> saved = parseAndSaveRecommendations(geminiResponse, user);
        return saved.stream().map(this::toResponse).toList();
    }

    private String buildTransactionSummary(List<Transaction> transactions) {
        if (transactions.isEmpty()) {
            return "El usuario no tiene transacciones en los últimos 60 días.";
        }

        Map<String, Double> byCategory = transactions.stream()
            .collect(Collectors.groupingBy(
                t -> t.getCategory().getName(),
                Collectors.summingDouble(t -> t.getAmount().doubleValue())
            ));

        StringBuilder sb = new StringBuilder("Resumen de gastos e ingresos del usuario en los últimos 60 días:\n");
        byCategory.forEach((cat, total) -> sb.append("- ").append(cat).append(": $").append(String.format("%.2f", total)).append("\n"));
        return sb.toString();
    }

    private String callGemini(String transactionSummary) {
        String systemPrompt = """
            Eres un asesor financiero personal. Genera exactamente 3 recomendaciones financieras personalizadas y concretas en español.
            Formato de respuesta: una recomendación por línea, comenzando con el tipo entre corchetes: [SAVINGS], [SPENDING], [GOAL], [ALERT] o [GENERAL].
            Ejemplo: [SAVINGS] Podrías ahorrar $500 al mes reduciendo gastos en entretenimiento.
            """;

        return aiCompletionClient.complete(systemPrompt, transactionSummary);
    }

    private List<Recommendation> parseAndSaveRecommendations(String text, User user) {
        List<Recommendation> result = new ArrayList<>();
        if (text == null || text.isBlank()) return result;

        for (String line : text.split("\\r?\\n")) {
            line = line.trim();
            if (line.isBlank()) continue;

            RecommendationType type = RecommendationType.GENERAL;
            if (line.startsWith("[SAVINGS]")) type = RecommendationType.SAVINGS;
            else if (line.startsWith("[SPENDING]")) type = RecommendationType.SPENDING;
            else if (line.startsWith("[GOAL]")) type = RecommendationType.GOAL;
            else if (line.startsWith("[ALERT]")) type = RecommendationType.ALERT;

            String message = line.replaceFirst("^\\[\\w+]\\s*", "");
            if (message.isBlank()) continue;

            Recommendation rec = recommendationRepository.save(Recommendation.builder()
                .user(user)
                .type(type)
                .message(message)
                .build());
            result.add(rec);
        }

        return result;
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
