package com.monargent.backend.service;

import com.monargent.backend.dto.category.CategoryCreateRequest;
import com.monargent.backend.dto.category.CategoryResponse;
import com.monargent.backend.dto.category.CategoryUpdateRequest;
import java.util.List;

public interface CategoryService {

    List<CategoryResponse> findAll();

    CategoryResponse create(CategoryCreateRequest request);

    CategoryResponse update(Long id, CategoryUpdateRequest request);

    void delete(Long id);
}