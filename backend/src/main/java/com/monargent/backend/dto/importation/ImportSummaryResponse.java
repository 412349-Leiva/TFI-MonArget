package com.monargent.backend.dto.importation;

import com.monargent.backend.dto.transaction.TransactionResponse;
import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportSummaryResponse {

    private int totalImported;
    private int incomes;
    private int expenses;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private Long receiptId;
    private List<TransactionResponse> transactions;
}
