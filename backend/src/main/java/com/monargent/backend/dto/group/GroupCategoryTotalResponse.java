package com.monargent.backend.dto.group;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupCategoryTotalResponse {

    private String categoryName;
    private String categoryColor;
    private BigDecimal total;
}
