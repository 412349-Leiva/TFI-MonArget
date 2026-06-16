package com.monargent.backend.controller;

import com.monargent.backend.dto.importation.ExtractedMovementDTO;
import com.monargent.backend.dto.importation.ImportPreviewResponse;
import com.monargent.backend.dto.receipt.ReceiptOCRResponse;
import com.monargent.backend.service.ImportService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final ImportService importService;

    @PostMapping("/scan")
    public ResponseEntity<ReceiptOCRResponse> scanReceipt(@RequestParam("file") MultipartFile file) {
        ImportPreviewResponse preview = importService.extract(file);
        ReceiptOCRResponse response = new ReceiptOCRResponse();
        response.setItems(mapToLegacyItems(preview.getMovements()));
        return ResponseEntity.ok(response);
    }

    private List<ReceiptOCRResponse.ReceiptItemDTO> mapToLegacyItems(List<ExtractedMovementDTO> movements) {
        if (movements == null) {
            return List.of();
        }
        return movements.stream().map(movement -> {
            ReceiptOCRResponse.ReceiptItemDTO item = new ReceiptOCRResponse.ReceiptItemDTO();
            item.setProducto(movement.getDescription());
            item.setPrecio(movement.getAmount() != null ? movement.getAmount().doubleValue() : 0.0);
            item.setCategoria(movement.getSuggestedCategory());
            item.setType(movement.getType());
            item.setDate(movement.getDate());
            return item;
        }).toList();
    }
}
