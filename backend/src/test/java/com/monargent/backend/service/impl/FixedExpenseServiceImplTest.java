package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.fixedexpense.FixedExpenseCreateRequest;
import com.monargent.backend.dto.fixedexpense.FixedExpenseResponse;
import com.monargent.backend.dto.fixedexpense.FixedExpenseUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.FixedExpense;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.FixedExpenseMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.FixedExpenseRepository;
import com.monargent.backend.service.CurrentUserService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FixedExpenseServiceImplTest {

    @Mock private FixedExpenseRepository fixedExpenseRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private FixedExpenseMapper fixedExpenseMapper;

    @InjectMocks
    private FixedExpenseServiceImpl service;

    private User user;
    private Category category;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("fe@example.com").password("x").verified(true).build();
        category = Category.builder().id(2L).name("Alquiler").type(CategoryType.EXPENSE).user(user).build();
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    void findAll_mapsResponses() {
        FixedExpense expense = FixedExpense.builder().id(9L).title("Alquiler").user(user).build();
        FixedExpenseResponse response = FixedExpenseResponse.builder().id(9L).title("Alquiler").build();
        when(fixedExpenseRepository.findAllByUserId(1L)).thenReturn(List.of(expense));
        when(fixedExpenseMapper.toResponse(expense)).thenReturn(response);

        assertThat(service.findAll()).containsExactly(response);
    }

    @Test
    void create_success() {
        when(currentUserService.getCurrentUser()).thenReturn(user);
        FixedExpenseCreateRequest request = FixedExpenseCreateRequest.builder()
            .title("Luz").amount(new BigDecimal("50")).dueDay(10)
            .startDate(LocalDate.now()).categoryId(2L).build();
        FixedExpense entity = FixedExpense.builder().title("Luz").build();
        FixedExpense saved = FixedExpense.builder().id(3L).title("Luz").user(user).build();
        FixedExpenseResponse response = FixedExpenseResponse.builder().id(3L).title("Luz").build();

        when(categoryRepository.findByIdAndUserId(2L, 1L)).thenReturn(Optional.of(category));
        when(fixedExpenseMapper.toEntity(request, category)).thenReturn(entity);
        when(fixedExpenseRepository.save(entity)).thenReturn(saved);
        when(fixedExpenseMapper.toResponse(saved)).thenReturn(response);

        assertThat(service.create(request).getId()).isEqualTo(3L);
        assertThat(entity.getUser()).isEqualTo(user);
    }

    @Test
    void create_categoryMissing_throws() {
        when(categoryRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create(FixedExpenseCreateRequest.builder()
            .title("X").amount(BigDecimal.ONE).dueDay(1).startDate(LocalDate.now()).categoryId(99L).build()))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Categoría no encontrada");
    }

    @Test
    void update_success() {
        FixedExpense existing = FixedExpense.builder().id(4L).title("Viejo").user(user).build();
        FixedExpenseUpdateRequest request = FixedExpenseUpdateRequest.builder()
            .title("Nuevo").amount(new BigDecimal("80")).dueDay(5)
            .startDate(LocalDate.now()).categoryId(2L).build();
        FixedExpenseResponse response = FixedExpenseResponse.builder().id(4L).title("Nuevo").build();

        when(fixedExpenseRepository.findByIdAndUserId(4L, 1L)).thenReturn(Optional.of(existing));
        when(categoryRepository.findByIdAndUserId(2L, 1L)).thenReturn(Optional.of(category));
        when(fixedExpenseRepository.save(existing)).thenReturn(existing);
        when(fixedExpenseMapper.toResponse(existing)).thenReturn(response);

        assertThat(service.update(4L, request).getTitle()).isEqualTo("Nuevo");
        verify(fixedExpenseMapper).updateEntity(existing, request, category);
    }

    @Test
    void delete_success() {
        FixedExpense existing = FixedExpense.builder().id(5L).user(user).build();
        when(fixedExpenseRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        service.delete(5L);
        verify(fixedExpenseRepository).delete(existing);
    }

    @Test
    void delete_missing_throws() {
        when(fixedExpenseRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.delete(5L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Gasto fijo no encontrado");
    }
}
