package com.monargent.backend.dto.category;

import com.monargent.backend.enums.CategoryType;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

    private Long id;
    private String name;
    private String icon;
    private String color;
    private CategoryType type;
    private LocalDateTime createdAt;
}