package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.transaction.TransactionCreateRequest;
import com.monargent.backend.dto.transaction.TransactionResponse;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.Transaction;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.enums.SavingGoalStatus;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.mapper.TransactionMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.SpendingLimitAlertHelper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TransactionServiceImplTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private SpendingLimitRepository spendingLimitRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private SpendingLimitAlertHelper spendingLimitAlertHelper;
    @Mock private TransactionMapper transactionMapper;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    private User user;
    private Category expenseCategory;

    @BeforeEach
    void setUp() {
        user = User.builder()
            .id(1L)
            .name("Mon")
            .lastname("Argent")
            .email("tx@example.com")
            .password("secret")
            .verified(true)
            .build();
        expenseCategory = Category.builder()
            .id(10L)
            .name("Comida")
            .type(CategoryType.EXPENSE)
            .user(user)
            .build();
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        lenient().when(currentUserService.getCurrentUser()).thenReturn(user);
    }

    @Test
    void create_typeMismatch_throwsSpanishMessage() {
        when(categoryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(expenseCategory));

        TransactionCreateRequest request = TransactionCreateRequest.builder()
            .title("Sueldo mal tipado")
            .amount(new BigDecimal("100"))
            .date(LocalDateTime.now())
            .type(TransactionType.INCOME)
            .categoryId(10L)
            .build();

        assertThatThrownBy(() -> transactionService.create(request))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("El tipo de movimiento debe coincidir con el tipo de la categoría");
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void create_expense_updatesSpendingLimitAndAlerts() {
        LocalDateTime date = LocalDateTime.now();
        TransactionCreateRequest request = TransactionCreateRequest.builder()
            .title("Supermercado")
            .amount(new BigDecimal("50"))
            .date(date)
            .type(TransactionType.EXPENSE)
            .categoryId(10L)
            .build();
        Transaction entity = Transaction.builder()
            .title("Supermercado")
            .amount(new BigDecimal("50"))
            .date(date)
            .type(TransactionType.EXPENSE)
            .category(expenseCategory)
            .build();
        Transaction saved = Transaction.builder()
            .id(99L)
            .title("Supermercado")
            .amount(new BigDecimal("50"))
            .date(date)
            .type(TransactionType.EXPENSE)
            .category(expenseCategory)
            .user(user)
            .build();
        SpendingLimit limit = SpendingLimit.builder()
            .id(5L)
            .amountLimit(new BigDecimal("200"))
            .currentAmount(new BigDecimal("20"))
            .month(date.getMonthValue())
            .year(date.getYear())
            .category(expenseCategory)
            .user(user)
            .build();

        when(categoryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(expenseCategory));
        when(transactionMapper.toEntity(request, expenseCategory)).thenReturn(entity);
        when(transactionRepository.save(entity)).thenReturn(saved);
        when(transactionMapper.toResponse(saved)).thenReturn(TransactionResponse.builder().id(99L).build());
        when(spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(
            eq(1L), eq(10L), eq(date.getMonthValue()), eq(date.getYear())))
            .thenReturn(Optional.of(limit));

        transactionService.create(request);

        ArgumentCaptor<SpendingLimit> limitCaptor = ArgumentCaptor.forClass(SpendingLimit.class);
        verify(spendingLimitRepository).save(limitCaptor.capture());
        org.assertj.core.api.Assertions.assertThat(limitCaptor.getValue().getCurrentAmount())
            .isEqualByComparingTo("70");
        verify(spendingLimitAlertHelper).checkAndNotify(
            eq(limit), eq(new BigDecimal("20")), eq(new BigDecimal("70")));
    }

    @Test
    void createFromSavingGoalDeposit_insufficientBalance_throwsSpanishMessage() {
        SavingGoal goal = SavingGoal.builder()
            .id(3L)
            .title("Viaje")
            .targetAmount(new BigDecimal("1000"))
            .currentAmount(BigDecimal.ZERO)
            .status(SavingGoalStatus.ACTIVE)
            .user(user)
            .build();
        when(transactionRepository.findAllByUserIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
            .thenReturn(List.of(
                Transaction.builder()
                    .type(TransactionType.INCOME)
                    .amount(new BigDecimal("100"))
                    .build(),
                Transaction.builder()
                    .type(TransactionType.EXPENSE)
                    .amount(new BigDecimal("80"))
                    .build()
            ));

        assertThatThrownBy(() -> transactionService.createFromSavingGoalDeposit(goal, new BigDecimal("50")))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Saldo insuficiente para realizar el depósito");
        verify(transactionRepository, never()).save(any());
    }
}
