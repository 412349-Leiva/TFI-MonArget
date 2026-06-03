package com.monargent.backend.dto.recommendation;

import com.monargent.backend.enums.RecommendationType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    private Long id;
    private RecommendationType type;
    private String message;
    private BigDecimal estimatedImpact;
    private LocalDateTime createdAt;
}
