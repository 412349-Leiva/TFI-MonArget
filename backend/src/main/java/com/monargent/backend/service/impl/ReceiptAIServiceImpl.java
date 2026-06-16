package com.monargent.backend.service.impl;

import com.monargent.backend.dto.importation.ExtractedMovementDTO;
import com.monargent.backend.dto.receipt.ReceiptOCRResponse;
import com.monargent.backend.service.FinancialExtractionAIService;
import com.monargent.backend.service.ReceiptAIService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReceiptAIServiceImpl implements ReceiptAIService {

    private final FinancialExtractionAIService financialExtractionAIService;

    @Override
    public ReceiptOCRResponse extractStructuredData(String rawOcrText) {
        List<ExtractedMovementDTO> movements = financialExtractionAIService.extractMovements(rawOcrText);

        List<ReceiptOCRResponse.ReceiptItemDTO> items = movements.stream()
            .map(this::toReceiptItem)
            .toList();

        ReceiptOCRResponse response = new ReceiptOCRResponse();
        response.setItems(items);
        return response;
    }

    private ReceiptOCRResponse.ReceiptItemDTO toReceiptItem(ExtractedMovementDTO movement) {
        ReceiptOCRResponse.ReceiptItemDTO item = new ReceiptOCRResponse.ReceiptItemDTO();
        item.setProducto(movement.getDescription());
        item.setPrecio(movement.getAmount() != null ? movement.getAmount().doubleValue() : 0.0);
        item.setCategoria(movement.getSuggestedCategory());
        item.setType(movement.getType());
        item.setDate(movement.getDate());
        return item;
    }
}
