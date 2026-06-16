package com.monargent.backend.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.dto.importation.ExtractedMovementDTO;
import com.monargent.backend.enums.TransactionType;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class GeminiFinancialExtractionServiceImplTest {

    private GeminiFinancialExtractionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GeminiFinancialExtractionServiceImpl(null, new ObjectMapper());
    }

    @Test
    void parseAiResponse_extractsMovementsFromJson() {
        String json = """
            {
              "movements": [
                {
                  "type": "EXPENSE",
                  "description": "Supermercado",
                  "suggestedCategory": "Comida",
                  "amount": 1500.50,
                  "date": "2026-03-15"
                },
                {
                  "type": "INCOME",
                  "description": "Sueldo",
                  "suggestedCategory": "Salario",
                  "amount": 500000,
                  "date": null
                }
              ]
            }
            """;

        List<ExtractedMovementDTO> movements = service.parseAiResponse(json);

        assertEquals(2, movements.size());
        assertEquals("Supermercado", movements.get(0).getDescription());
        assertEquals(TransactionType.EXPENSE, movements.get(0).getType());
        assertEquals(0, movements.get(0).getAmount().compareTo(new BigDecimal("1500.50")));
        assertEquals(TransactionType.INCOME, movements.get(1).getType());
    }

    @Test
    void parseAiResponse_handlesMarkdownWrappedJson() {
        String wrapped = """
            ```json
            {"movements":[{"type":"EXPENSE","description":"Taxi","suggestedCategory":"Transporte","amount":3200,"date":"2026-01-10"}]}
            ```
            """;

        List<ExtractedMovementDTO> movements = service.parseAiResponse(wrapped);

        assertEquals(1, movements.size());
        assertEquals("Taxi", movements.get(0).getDescription());
    }

    @Test
    void parseAiResponse_returnsEmptyOnInvalidJson() {
        List<ExtractedMovementDTO> movements = service.parseAiResponse("not-json");
        assertTrue(movements.isEmpty());
    }

    @Test
    void parseAiResponse_extractsItemsArrayWithSpanishFields() {
        String json = """
            {
              "items": [
                {
                  "producto": "Leche entera 1L",
                  "precio": "1.234,56",
                  "categoria": "Comida"
                }
              ]
            }
            """;

        List<ExtractedMovementDTO> movements = service.parseAiResponse(json);

        assertEquals(1, movements.size());
        assertEquals("Leche entera 1L", movements.get(0).getDescription());
        assertEquals(0, movements.get(0).getAmount().compareTo(new BigDecimal("1234.56")));
        assertEquals("Comida", movements.get(0).getSuggestedCategory());
    }
}
