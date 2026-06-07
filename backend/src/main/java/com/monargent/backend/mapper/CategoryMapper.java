package com.monargent.backend.mapper;

import com.monargent.backend.dto.category.CategoryCreateRequest;
import com.monargent.backend.dto.category.CategoryResponse;
import com.monargent.backend.dto.category.CategoryUpdateRequest;
import com.monargent.backend.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public Category toEntity(CategoryCreateRequest request) {
        return Category.builder()
            .name(request.getName().trim())
            .icon(request.getIcon())
            .color(request.getColor())
            .type(request.getType())
            .build();
    }

    public void updateEntity(Category category, CategoryUpdateRequest request) {
        category.setName(request.getName().trim());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setType(request.getType());
    }

    public CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
            .id(category.getId())
            .name(category.getName())
            .icon(category.getIcon())
            .color(category.getColor())
            .type(category.getType())
            .createdAt(category.getCreatedAt())
            .build();
    }
}