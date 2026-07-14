package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.category.CategoryCreateRequest;
import com.monargent.backend.dto.category.CategoryUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceAlreadyExistsException;
import com.monargent.backend.mapper.CategoryMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.FixedExpenseRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CurrentUserService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock private CategoryRepository categoryRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private SpendingLimitRepository spendingLimitRepository;
    @Mock private FixedExpenseRepository fixedExpenseRepository;
    @Mock private CurrentUserService currentUserService;
    @Mock private CategoryMapper categoryMapper;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @BeforeEach
    void setUp() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
    }

    @Test
    void create_duplicateNameIgnoreCase_throwsSpanishMessage() {
        when(categoryRepository.existsByUserIdAndNameIgnoreCase(1L, "comida")).thenReturn(true);

        CategoryCreateRequest request = CategoryCreateRequest.builder()
            .name("  comida  ")
            .type(CategoryType.EXPENSE)
            .icon("tag")
            .color("#fff")
            .build();

        assertThatThrownBy(() -> categoryService.create(request))
            .isInstanceOf(ResourceAlreadyExistsException.class)
            .hasMessage("Ya existe una categoría con ese nombre");
        verify(categoryRepository, never()).save(any());
    }

    @Test
    void delete_blockedWhenLinkedTransactions_throwsSpanishMessage() {
        Category category = Category.builder()
            .id(4L)
            .name("Transporte")
            .type(CategoryType.EXPENSE)
            .build();
        when(categoryRepository.findByIdAndUserId(4L, 1L)).thenReturn(Optional.of(category));
        when(transactionRepository.existsByUserIdAndCategoryId(1L, 4L)).thenReturn(true);

        assertThatThrownBy(() -> categoryService.delete(4L))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("No se puede eliminar la categoría porque tiene movimientos asociados");
        verify(categoryRepository, never()).delete(any());
    }

    @Test
    void findAll_create_update_delete_success() {
        Category category = Category.builder().id(1L).name("Comida").type(CategoryType.EXPENSE).build();
        when(categoryRepository.findAllByUserId(1L)).thenReturn(List.of(category));
        when(categoryMapper.toResponse(category)).thenReturn(
            com.monargent.backend.dto.category.CategoryResponse.builder().id(1L).name("Comida").build());
        assertThat(categoryService.findAll()).hasSize(1);

        when(currentUserService.getCurrentUser()).thenReturn(User.builder().id(1L).name("A").lastname("B")
            .email("a@example.com").password("x").verified(true).build());
        when(categoryRepository.existsByUserIdAndNameIgnoreCase(1L, "Nueva")).thenReturn(false);
        CategoryCreateRequest create = CategoryCreateRequest.builder()
            .name("Nueva").type(CategoryType.EXPENSE).icon("i").color("#fff").build();
        when(categoryMapper.toEntity(create)).thenReturn(category);
        when(categoryRepository.save(category)).thenReturn(category);
        assertThat(categoryService.create(create).getId()).isEqualTo(1L);

        when(categoryRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(category));
        CategoryUpdateRequest update = CategoryUpdateRequest.builder()
            .name("Otro").type(CategoryType.EXPENSE).build();
        assertThat(categoryService.update(1L, update).getId()).isEqualTo(1L);
        verify(categoryMapper).updateEntity(category, update);

        when(transactionRepository.existsByUserIdAndCategoryId(1L, 1L)).thenReturn(false);
        when(spendingLimitRepository.existsByUserIdAndCategoryId(1L, 1L)).thenReturn(false);
        when(fixedExpenseRepository.existsByUserIdAndCategoryId(1L, 1L)).thenReturn(false);
        categoryService.delete(1L);
        verify(categoryRepository).delete(category);
    }
}
