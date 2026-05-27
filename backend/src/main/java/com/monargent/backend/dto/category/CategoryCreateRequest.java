package com.monargent.backend.dto.category;

import com.monargent.backend.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryCreateRequest {

    @NotBlank
    @Size(max = 120)
    private String name;

    @Size(max = 50)
    private String icon;

    @Size(max = 20)
    private String color;

    @NotNull
    private CategoryType type;
}