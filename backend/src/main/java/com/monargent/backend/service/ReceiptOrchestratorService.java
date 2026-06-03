package com.monargent.backend.service;

import com.monargent.backend.dto.receipt.ReceiptOCRResponse;
import com.monargent.backend.dto.receipt.ReceiptResponse;
import com.monargent.backend.enums.ReceiptStatus; // ¡No olvides importar tu enum!
import com.monargent.backend.service.impl.OCRSpaceService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ReceiptOrchestratorService {

    private final OCRSpaceService ocrService; 
    private final ReceiptAIService aiService;

    public ReceiptResponse processAndSaveReceipt(MultipartFile file) {
        String rawText = ocrService.extractRawText(file);
        
        ReceiptOCRResponse structuredData = aiService.extractStructuredData(rawText);
        
        return ReceiptResponse.builder()
                .detectedCommerce(structuredData.getMerchantName())
                .detectedAmount(structuredData.getTotalAmount())
                .extractedText(rawText)
                .status(ReceiptStatus.PENDING) 
                .build();
    }
}