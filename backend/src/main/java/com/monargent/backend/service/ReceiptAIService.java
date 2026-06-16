package com.monargent.backend.service;

import com.monargent.backend.dto.receipt.ReceiptOCRResponse;

public interface ReceiptAIService {
    ReceiptOCRResponse extractStructuredData(String rawOcrText);
}