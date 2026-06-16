package com.monargent.backend.dto.receipt;

import com.monargent.backend.enums.TransactionType;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class ReceiptOCRResponse {
    private List<ReceiptItemDTO> items;

    @Data
    public static class ReceiptItemDTO {
        private String producto;
        private Double precio;
        private String categoria;
        private TransactionType type;
        private LocalDate date;
    }
}