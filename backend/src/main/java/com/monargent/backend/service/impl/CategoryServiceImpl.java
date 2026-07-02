package com.monargent.backend.service.impl;

import com.monargent.backend.dto.category.CategoryCreateRequest;
import com.monargent.backend.dto.category.CategoryResponse;
import com.monargent.backend.dto.category.CategoryUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceAlreadyExistsException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.CategoryMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.FixedExpenseRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.service.CategoryService;
import com.monargent.backend.service.CurrentUserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final SpendingLimitRepository spendingLimitRepository;
    private final FixedExpenseRepository fixedExpenseRepository;
    private final CurrentUserService currentUserService;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        Long userId = currentUserService.getCurrentUserId();
        return categoryRepository.findAllByUserId(userId).stream()
            .map(categoryMapper::toResponse)
            .toList();
    }

    @Override
    public CategoryResponse create(CategoryCreateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        if (categoryRepository.existsByUserIdAndNameIgnoreCase(userId, request.getName().trim())) {
            throw new ResourceAlreadyExistsException("Ya existe una categoría con ese nombre");
        }

        Category category = categoryMapper.toEntity(request);
        category.setUser(currentUserService.getCurrentUser());
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    public CategoryResponse update(Long id, CategoryUpdateRequest request) {
        Category category = categoryRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));

        categoryMapper.updateEntity(category, request);
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    public void delete(Long id) {
        Long userId = currentUserService.getCurrentUserId();
        Category category = categoryRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada"));

        if (transactionRepository.existsByUserIdAndCategoryId(userId, category.getId())
            || spendingLimitRepository.existsByUserIdAndCategoryId(userId, category.getId())
            || fixedExpenseRepository.existsByUserIdAndCategoryId(userId, category.getId())) {
            throw new InvalidRequestException("No se puede eliminar la categoría porque tiene movimientos asociados");
        }

        categoryRepository.delete(category);
    }
}