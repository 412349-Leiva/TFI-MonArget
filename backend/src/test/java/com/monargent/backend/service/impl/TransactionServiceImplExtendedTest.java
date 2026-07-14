package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.importation.ImportMovementItemRequest;
import com.monargent.backend.dto.transaction.TransactionCreateRequest;
import com.monargent.backend.dto.transaction.TransactionResponse;
import com.monargent.backend.dto.transaction.TransactionUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.Receipt;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.Transaction;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.enums.SavingGoalStatus;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.TransactionMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.SpendingLimitAlertHelper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class TransactionServiceImplExtendedTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private SpendingLimitRepository spendingLimitRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private SpendingLimitAlertHelper spendingLimitAlertHelper;
    @Mock private TransactionMapper transactionMapper;

    @InjectMocks
    private TransactionServiceImpl service;

    private User user;
    private Category expenseCategory;
    private Category incomeCategory;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("tx@example.com").password("x").verified(true).build();
        expenseCategory = Category.builder().id(10L).name("Comida").type(CategoryType.EXPENSE).user(user).build();
        incomeCategory = Category.builder().id(11L).name("Sueldo").type(CategoryType.INCOME).user(user).build();
        lenient().when(currentUserService.getCurrentUserId()).thenReturn(1L);
        lenient().when(currentUserService.getCurrentUser()).thenReturn(user);
    }

    @Test
    void findAll_andGetById() {
        Transaction tx = Transaction.builder().id(1L).type(TransactionType.EXPENSE)
            .amount(BigDecimal.TEN).category(expenseCategory).user(user).build();
        when(transactionRepository.findAll(any(Specification.class), any(Sort.class)))
            .thenReturn(List.of(tx));
        when(transactionMapper.toResponse(tx)).thenReturn(TransactionResponse.builder().id(1L).build());

        assertThat(service.findAll(7, 2026, 10L, TransactionType.EXPENSE)).hasSize(1);
        assertThat(service.findAll(null, 2026, null, null)).hasSize(1);
        assertThat(service.findAll(null, null, null, null)).hasSize(1);

        when(transactionRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(tx));
        assertThat(service.getById(1L).getId()).isEqualTo(1L);
        when(transactionRepository.findByIdAndUserId(9L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getById(9L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createFromImport_andSavingGoalDeposit_success() {
        ImportMovementItemRequest item = ImportMovementItemRequest.builder()
            .description(" Pan ").amount(new BigDecimal("20"))
            .type(TransactionType.EXPENSE).date(LocalDate.of(2026, 7, 1)).build();
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> {
            Transaction t = inv.getArgument(0);
            t.setId(50L);
            return t;
        });
        when(transactionMapper.toResponse(any())).thenReturn(TransactionResponse.builder().id(50L).build());
        when(spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(anyLong(), anyLong(), anyInt(), anyInt()))
            .thenReturn(Optional.empty());

        assertThat(service.createFromImport(item, expenseCategory, Receipt.builder().id(1L).build()).getId())
            .isEqualTo(50L);

        when(transactionRepository.findAllByUserIdAndMonthAndYear(anyLong(), anyInt(), anyInt()))
            .thenReturn(List.of(Transaction.builder().type(TransactionType.INCOME)
                .amount(new BigDecimal("500")).build()));
        when(categoryRepository.findByUserIdAndNameIgnoreCaseAndType(1L, "Ahorros", CategoryType.EXPENSE))
            .thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setId(77L);
            return c;
        });
        SavingGoal goal = SavingGoal.builder().title("Viaje").targetAmount(new BigDecimal("1000"))
            .currentAmount(BigDecimal.ZERO).status(SavingGoalStatus.ACTIVE).user(user).build();
        assertThat(service.createFromSavingGoalDeposit(goal, new BigDecimal("50"))).isNotNull();
    }

    @Test
    void createFromGroupSettlement_andExpense_andDeleteBySource() {
        when(categoryRepository.findByUserIdAndNameIgnoreCaseAndType(1L, "Gastos grupales", CategoryType.EXPENSE))
            .thenReturn(Optional.empty());
        when(categoryRepository.findByUserIdAndNameIgnoreCaseAndType(1L, "Gastos grupales", CategoryType.INCOME))
            .thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setId(88L);
            return c;
        });
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(anyLong(), anyLong(), anyInt(), anyInt()))
            .thenReturn(Optional.empty());

        service.createFromGroupSettlement(user, TransactionType.EXPENSE, new BigDecimal("30"),
            "Asado", "bob", 10L);
        service.createFromGroupSettlement(user, TransactionType.INCOME, new BigDecimal("30"),
            "Asado", "bob", 10L);

        Group group = Group.builder().id(10L).title("Asado").build();
        GroupExpense expense = GroupExpense.builder().id(3L).title("Carne").amount(new BigDecimal("40"))
            .date(LocalDateTime.now()).category(expenseCategory).build();
        service.createFromGroupExpense(user, group, expense);

        Category groupCat = Category.builder().id(88L).name("Gastos grupales").type(CategoryType.EXPENSE).build();
        Transaction linked = Transaction.builder().id(1L).type(TransactionType.EXPENSE)
            .amount(new BigDecimal("40")).date(LocalDateTime.now()).user(user).category(groupCat).build();
        when(transactionRepository.findAllBySourceGroupId(10L)).thenReturn(List.of(linked));
        SpendingLimit limit = SpendingLimit.builder().id(1L).currentAmount(new BigDecimal("40"))
            .amountLimit(new BigDecimal("100")).build();
        when(spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(
            eq(1L), eq(88L), anyInt(), anyInt())).thenReturn(Optional.of(limit));

        service.deleteBySourceGroupId(10L);
        verify(transactionRepository).deleteAllBySourceGroupId(10L);
        assertThat(limit.getCurrentAmount()).isEqualByComparingTo("0");
    }

    @Test
    void update_andDelete_expenseAdjustLimits() {
        LocalDateTime date = LocalDateTime.now();
        Transaction existing = Transaction.builder().id(5L).type(TransactionType.EXPENSE)
            .amount(new BigDecimal("20")).date(date).category(expenseCategory).user(user).build();
        when(transactionRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(expenseCategory));
        when(transactionRepository.save(existing)).thenReturn(existing);
        when(transactionMapper.toResponse(existing)).thenReturn(TransactionResponse.builder().id(5L).build());
        SpendingLimit limit = SpendingLimit.builder().id(1L).currentAmount(new BigDecimal("50"))
            .amountLimit(new BigDecimal("100")).build();
        when(spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(
            eq(1L), eq(10L), anyInt(), anyInt())).thenReturn(Optional.of(limit));
        when(spendingLimitRepository.save(limit)).thenReturn(limit);

        service.update(5L, TransactionUpdateRequest.builder()
            .title("Nuevo").amount(new BigDecimal("30")).date(date)
            .type(TransactionType.EXPENSE).categoryId(10L).build());
        verify(transactionMapper).updateEntity(eq(existing), any(), eq(expenseCategory));

        service.delete(5L);
        verify(transactionRepository).delete(existing);
    }

    @Test
    void create_income_skipsLimitUpdate() {
        when(categoryRepository.findByIdAndUserId(11L, 1L)).thenReturn(Optional.of(incomeCategory));
        TransactionCreateRequest request = TransactionCreateRequest.builder()
            .title("Sueldo").amount(new BigDecimal("1000")).date(LocalDateTime.now())
            .type(TransactionType.INCOME).categoryId(11L).build();
        Transaction entity = Transaction.builder().type(TransactionType.INCOME)
            .amount(new BigDecimal("1000")).date(LocalDateTime.now()).category(incomeCategory).build();
        when(transactionMapper.toEntity(request, incomeCategory)).thenReturn(entity);
        when(transactionRepository.save(entity)).thenReturn(entity);
        when(transactionMapper.toResponse(entity)).thenReturn(TransactionResponse.builder().id(1L).build());

        service.create(request);
        verify(spendingLimitRepository, never())
            .findByUserIdAndCategoryIdAndMonthAndYear(anyLong(), anyLong(), anyInt(), anyInt());
    }

    @Test
    void createFromImport_typeMismatch_throws() {
        ImportMovementItemRequest item = ImportMovementItemRequest.builder()
            .description("X").amount(BigDecimal.ONE).type(TransactionType.INCOME).build();
        assertThatThrownBy(() -> service.createFromImport(item, expenseCategory, null))
            .isInstanceOf(InvalidRequestException.class);
    }
}
