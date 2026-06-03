package com.monargent.backend.dto.receipt;

import com.monargent.backend.enums.ReceiptStatus;
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
public class ReceiptResponse {

    private Long id;
    private String imageUrl;
    private String extractedText;
    private BigDecimal detectedAmount;
    private String detectedCommerce;
    private String suggestedCategory;
    private ReceiptStatus status;
    private LocalDateTime createdAt;
}
