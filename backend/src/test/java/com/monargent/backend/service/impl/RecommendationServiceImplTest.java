package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.recommendation.RecommendationResponse;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.Recommendation;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.Transaction;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.enums.RecommendationType;
import com.monargent.backend.enums.SavingGoalStatus;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.AiServiceUnavailableException;
import com.monargent.backend.repository.RecommendationRepository;
import com.monargent.backend.repository.SavingGoalRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.ai.AiCompletionClient;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceImplTest {

    @Mock private RecommendationRepository recommendationRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private SavingGoalRepository savingGoalRepository;
    @Mock private SpendingLimitRepository spendingLimitRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private AiCompletionClient aiCompletionClient;

    @InjectMocks
    private RecommendationServiceImpl service;

    private User user;
    private Category food;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("rec@example.com").password("x").verified(true).build();
        food = Category.builder().id(2L).name("Comida").type(CategoryType.EXPENSE).user(user).build();
        lenient().when(currentUserService.getCurrentUser()).thenReturn(user);
        lenient().when(currentUserService.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    void findAll_mapsRepositoryResults() {
        Recommendation r = Recommendation.builder()
            .id(9L).type(RecommendationType.GENERAL).message("Tip").user(user)
            .createdAt(LocalDateTime.now()).build();
        when(recommendationRepository.findAllByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(r));

        List<RecommendationResponse> result = service.findAll();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getMessage()).isEqualTo("Tip");
    }

    @Test
    void generate_parsesAiLines() {
        int month = LocalDate.now().getMonthValue();
        int year = LocalDate.now().getYear();
        when(transactionRepository.findAllByUserId(1L)).thenReturn(List.of(
            Transaction.builder().type(TransactionType.EXPENSE).amount(new BigDecimal("100"))
                .date(LocalDateTime.now()).category(food).build()
        ));
        when(savingGoalRepository.findAllByUserId(1L)).thenReturn(List.of(
            SavingGoal.builder().title("Viaje").targetAmount(new BigDecimal("1000"))
                .currentAmount(new BigDecimal("100")).status(SavingGoalStatus.ACTIVE).user(user).build()
        ));
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of(
            SpendingLimit.builder().month(month).year(year).amountLimit(new BigDecimal("200"))
                .currentAmount(new BigDecimal("150")).category(food).user(user).build()
        ));
        when(aiCompletionClient.complete(anyString(), anyString())).thenReturn("""
            [SAVINGS] Ahorrá más
            [SPENDING] Gastá menos en comida
            [GOAL] Sumá al viaje
            [ALERT] Cuidá el límite
            [GENERAL] Tip general
            """);
        when(recommendationRepository.save(any(Recommendation.class))).thenAnswer(inv -> {
            Recommendation rec = inv.getArgument(0);
            rec.setId((long) (Math.random() * 1000));
            return rec;
        });

        List<RecommendationResponse> result = service.generate();
        assertThat(result).hasSize(5);
        verify(recommendationRepository).deleteAllByUserId(1L);
    }

    @Test
    void generate_whenAiUnavailable_usesFallback() {
        int month = LocalDate.now().getMonthValue();
        int year = LocalDate.now().getYear();
        when(transactionRepository.findAllByUserId(1L)).thenReturn(List.of(
            Transaction.builder().type(TransactionType.EXPENSE).amount(new BigDecimal("500"))
                .date(LocalDateTime.now()).category(food).build()
        ));
        when(savingGoalRepository.findAllByUserId(1L)).thenReturn(List.of(
            SavingGoal.builder().title("Meta").targetAmount(new BigDecimal("1000"))
                .currentAmount(BigDecimal.ZERO).status(SavingGoalStatus.ACTIVE).user(user).build()
        ));
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of(
            SpendingLimit.builder().month(month).year(year).amountLimit(new BigDecimal("100"))
                .currentAmount(new BigDecimal("100")).category(food).user(user).build()
        ));
        when(aiCompletionClient.complete(anyString(), anyString()))
            .thenThrow(new AiServiceUnavailableException("down"));
        when(recommendationRepository.save(any(Recommendation.class))).thenAnswer(inv -> inv.getArgument(0));

        List<RecommendationResponse> result = service.generate();
        assertThat(result).isNotEmpty().hasSizeLessThanOrEqualTo(3);
        assertThat(result.stream().anyMatch(r -> r.getType() == RecommendationType.ALERT
            || r.getType() == RecommendationType.GOAL
            || r.getType() == RecommendationType.GENERAL)).isTrue();
    }

    @Test
    void generate_emptyContext_runtimeError_usesGeneralFallback() {
        when(transactionRepository.findAllByUserId(1L)).thenReturn(List.of());
        when(savingGoalRepository.findAllByUserId(1L)).thenReturn(List.of());
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of());
        when(aiCompletionClient.complete(anyString(), anyString())).thenThrow(new RuntimeException("boom"));
        when(recommendationRepository.save(any(Recommendation.class))).thenAnswer(inv -> inv.getArgument(0));

        List<RecommendationResponse> result = service.generate();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getType()).isEqualTo(RecommendationType.GENERAL);
    }

    @Test
    void generate_limitBelowFifty_withoutGoal_stillBuildsSpendingTip() {
        when(transactionRepository.findAllByUserId(1L)).thenReturn(List.of(
            Transaction.builder().type(TransactionType.EXPENSE).amount(new BigDecimal("80"))
                .date(LocalDateTime.now()).category(food).build()
        ));
        when(savingGoalRepository.findAllByUserId(1L)).thenReturn(List.of());
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of());
        when(aiCompletionClient.complete(anyString(), anyString())).thenReturn("");
        when(recommendationRepository.save(any(Recommendation.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.generate()).isNotEmpty();
    }
}
