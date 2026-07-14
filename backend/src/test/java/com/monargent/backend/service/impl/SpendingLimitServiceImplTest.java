package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.spendinglimit.SpendingLimitCreateRequest;
import com.monargent.backend.dto.spendinglimit.SpendingLimitResponse;
import com.monargent.backend.dto.spendinglimit.SpendingLimitUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.Transaction;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.ResourceAlreadyExistsException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.SpendingLimitMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.SpendingLimitAlertHelper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SpendingLimitServiceImplTest {

    @Mock private SpendingLimitRepository spendingLimitRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private SpendingLimitMapper spendingLimitMapper;
    @Mock private SpendingLimitAlertHelper spendingLimitAlertHelper;

    @InjectMocks
    private SpendingLimitServiceImpl service;

    private User user;
    private Category category;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("sl@example.com").password("x").verified(true).build();
        category = Category.builder().id(2L).name("Ocio").type(CategoryType.EXPENSE).user(user).build();
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    void findAll_maps() {
        SpendingLimit limit = SpendingLimit.builder().id(3L).build();
        SpendingLimitResponse response = SpendingLimitResponse.builder().id(3L).build();
        when(spendingLimitRepository.findAllByUserId(1L)).thenReturn(List.of(limit));
        when(spendingLimitMapper.toResponse(limit)).thenReturn(response);
        assertThat(service.findAll()).containsExactly(response);
    }

    @Test
    void create_sumsExistingExpenses_andAlerts() {
        when(currentUserService.getCurrentUser()).thenReturn(user);
        SpendingLimitCreateRequest request = SpendingLimitCreateRequest.builder()
            .amountLimit(new BigDecimal("100")).month(7).year(2026).categoryId(2L).build();
        SpendingLimit entity = SpendingLimit.builder().amountLimit(new BigDecimal("100")).build();
        SpendingLimit saved = SpendingLimit.builder().id(9L).amountLimit(new BigDecimal("100"))
            .currentAmount(new BigDecimal("30")).build();
        when(categoryRepository.findByIdAndUserId(2L, 1L)).thenReturn(Optional.of(category));
        when(spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(1L, 2L, 7, 2026))
            .thenReturn(Optional.empty());
        when(spendingLimitMapper.toEntity(request, category)).thenReturn(entity);
        when(transactionRepository.findAllByUserIdAndMonthAndYearAndCategoryId(1L, 7, 2026, 2L))
            .thenReturn(List.of(
                Transaction.builder().type(TransactionType.EXPENSE).amount(new BigDecimal("30")).build(),
                Transaction.builder().type(TransactionType.INCOME).amount(new BigDecimal("99")).build()
            ));
        when(spendingLimitRepository.save(entity)).thenReturn(saved);
        when(spendingLimitMapper.toResponse(saved)).thenReturn(SpendingLimitResponse.builder().id(9L).build());

        assertThat(service.create(request).getId()).isEqualTo(9L);
        assertThat(entity.getCurrentAmount()).isEqualByComparingTo("30");
        verify(spendingLimitAlertHelper).checkAndNotify(saved, BigDecimal.ZERO, saved.getCurrentAmount());
    }

    @Test
    void create_duplicate_throws() {
        when(categoryRepository.findByIdAndUserId(2L, 1L)).thenReturn(Optional.of(category));
        when(spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(1L, 2L, 7, 2026))
            .thenReturn(Optional.of(SpendingLimit.builder().id(1L).build()));
        assertThatThrownBy(() -> service.create(SpendingLimitCreateRequest.builder()
            .amountLimit(BigDecimal.TEN).month(7).year(2026).categoryId(2L).build()))
            .isInstanceOf(ResourceAlreadyExistsException.class)
            .hasMessageContaining("Ya existe un límite");
    }

    @Test
    void update_andDelete() {
        SpendingLimit existing = SpendingLimit.builder().id(5L).currentAmount(new BigDecimal("10")).build();
        SpendingLimitUpdateRequest request = SpendingLimitUpdateRequest.builder()
            .amountLimit(new BigDecimal("200")).currentAmount(new BigDecimal("10"))
            .month(7).year(2026).categoryId(2L).build();
        when(spendingLimitRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findByIdAndUserId(2L, 1L)).thenReturn(Optional.of(category));
        when(spendingLimitRepository.save(existing)).thenReturn(existing);
        when(spendingLimitMapper.toResponse(existing)).thenReturn(SpendingLimitResponse.builder().id(5L).build());

        assertThat(service.update(5L, request).getId()).isEqualTo(5L);
        verify(spendingLimitAlertHelper).checkAndNotify(existing, new BigDecimal("10"), existing.getCurrentAmount());

        service.delete(5L);
        verify(spendingLimitRepository).delete(existing);
    }

    @Test
    void delete_missing_throws() {
        when(spendingLimitRepository.findByIdAndUserId(8L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.delete(8L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Límite de gasto no encontrado");
    }
}
