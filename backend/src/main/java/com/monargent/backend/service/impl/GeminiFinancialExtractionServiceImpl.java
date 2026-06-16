package com.monargent.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.dto.importation.ExtractedMovementDTO;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.service.FinancialExtractionAIService;
import com.monargent.backend.service.ai.AiCompletionClient;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiFinancialExtractionServiceImpl implements FinancialExtractionAIService {

    private static final String SYSTEM_PROMPT = """
        Eres un extractor de items de tickets y facturas argentinas (supermercado, farmacia, restaurante, kiosco, etc.).
        Analiza el texto OCR y extrae CADA producto o concepto facturado con su precio.
        Devuelve SOLO un JSON valido con esta forma exacta:
        {
          "movements": [
            {
              "type": "EXPENSE",
              "description": "nombre del producto o concepto",
              "suggestedCategory": "Comida",
              "amount": 1234.56,
              "date": "2026-03-15"
            }
          ]
        }
        Reglas:
        - Un objeto por linea de producto/servicio del ticket
        - NO incluyas subtotales, IVA, descuentos globales ni total general como items separados
        - type debe ser EXPENSE salvo que sea claramente un ingreso
        - suggestedCategory: Comida, Limpieza, Transporte, Servicios, Salud, Entretenimiento, Otros
        - amount: precio final de la linea (numerico positivo). Interpreta formato argentino 1.234,56
        - date en formato ISO (YYYY-MM-DD) si aparece en el ticket, o null
        - Si no hay items identificables, devuelve {"movements": []}
        """;

    private static final List<String> MOVEMENT_ARRAY_KEYS = List.of(
        "movements", "items", "productos", "lineas", "line_items"
    );

    private static final List<String> DESCRIPTION_FIELDS = List.of(
        "description", "producto", "product", "concepto", "nombre", "item", "descripcion"
    );

    private static final List<String> AMOUNT_FIELDS = List.of(
        "amount", "precio", "importe", "monto", "total", "price", "valor"
    );

    private final AiCompletionClient aiCompletionClient;
    private final ObjectMapper objectMapper;

    @Override
    public List<ExtractedMovementDTO> extractMovements(String rawText) {
        if (!StringUtils.hasText(rawText)) {
            log.warn("[OCR-DIAG] extractMovements called with empty raw text");
            return List.of();
        }

        String userPrompt = "Texto OCR del ticket:\n---\n" + rawText + "\n---";
        log.info("[OCR-DIAG] AI extraction system prompt:\n{}", SYSTEM_PROMPT);
        log.info("[OCR-DIAG] AI extraction user prompt:\n{}", userPrompt);

        String response = aiCompletionClient.complete(SYSTEM_PROMPT, userPrompt);
        log.info("[OCR-DIAG] AI extraction raw response:\n{}", response);

        if (!StringUtils.hasText(response)) {
            log.warn("[OCR-DIAG] AI extraction returned empty response");
            return List.of();
        }

        List<ExtractedMovementDTO> movements = parseAiResponse(response);
        log.info("[OCR-DIAG] Parsed transactions count: {}", movements.size());
        return movements;
    }

    // Visible for unit tests in the same package.
    List<ExtractedMovementDTO> parseAiResponse(String response) {
        try {
            String json = extractJson(response);
            JsonNode root = objectMapper.readTree(json);
            JsonNode movements = findMovementsArray(root);
            if (movements == null || !movements.isArray()) {
                log.warn("[OCR-DIAG] AI response JSON has no movements/items array");
                return List.of();
            }

            List<ExtractedMovementDTO> result = new ArrayList<>();
            for (JsonNode node : movements) {
                ExtractedMovementDTO dto = mapNode(node);
                if (dto != null) {
                    result.add(dto);
                }
            }
            return result;
        } catch (Exception ex) {
            log.error("Failed to parse AI extraction response: {}", ex.getMessage());
            return List.of();
        }
    }

    private JsonNode findMovementsArray(JsonNode root) {
        if (root == null) {
            return null;
        }
        if (root.isArray()) {
            return root;
        }
        for (String key : MOVEMENT_ARRAY_KEYS) {
            JsonNode node = root.get(key);
            if (node != null && node.isArray()) {
                return node;
            }
        }
        return null;
    }

    private ExtractedMovementDTO mapNode(JsonNode node) {
        String description = extractDescription(node);
        BigDecimal amount = extractAmount(node);
        if (!StringUtils.hasText(description) && amount == null) {
            return null;
        }

        TransactionType type = parseType(textOrNull(node, "type"));
        LocalDate date = parseDate(node.get("date"));

        return ExtractedMovementDTO.builder()
            .tempId(UUID.randomUUID().toString())
            .type(type)
            .description(description != null ? description : "")
            .suggestedCategory(textOrNull(node, "suggestedCategory", "categoria", "category"))
            .amount(amount != null ? amount : BigDecimal.ZERO)
            .date(date)
            .build();
    }

    private String extractDescription(JsonNode node) {
        for (String field : DESCRIPTION_FIELDS) {
            String value = textOrNull(node, field);
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private BigDecimal extractAmount(JsonNode node) {
        for (String field : AMOUNT_FIELDS) {
            BigDecimal value = decimalOrNull(node, field);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private TransactionType parseType(String value) {
        if (value != null && value.equalsIgnoreCase("INCOME")) {
            return TransactionType.INCOME;
        }
        return TransactionType.EXPENSE;
    }

    private LocalDate parseDate(JsonNode dateNode) {
        if (dateNode == null || dateNode.isNull()) {
            return null;
        }
        try {
            String text = dateNode.asText();
            if (!StringUtils.hasText(text) || "null".equalsIgnoreCase(text)) {
                return null;
            }
            return LocalDate.parse(text);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private String textOrNull(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode child = node.get(field);
            if (child == null || child.isNull()) {
                continue;
            }
            String text = child.asText();
            if (StringUtils.hasText(text)) {
                return text;
            }
        }
        return null;
    }

    private BigDecimal decimalOrNull(JsonNode node, String field) {
        JsonNode child = node.get(field);
        if (child == null || child.isNull()) {
            return null;
        }
        try {
            if (child.isNumber()) {
                return child.decimalValue();
            }
            return parseAmount(child.asText());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private BigDecimal parseAmount(String rawValue) {
        if (!StringUtils.hasText(rawValue)) {
            return null;
        }

        String text = rawValue.trim()
            .replace("$", "")
            .replace("ARS", "")
            .replace(" ", "");

        int commaIndex = text.lastIndexOf(',');
        int dotIndex = text.lastIndexOf('.');

        if (commaIndex >= 0 && commaIndex > dotIndex) {
            text = text.replace(".", "").replace(",", ".");
        } else {
            text = text.replace(",", "");
        }

        return new BigDecimal(text);
    }

    private String extractJson(String response) {
        String trimmed = response.trim();
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('{');
            int end = trimmed.lastIndexOf('}');
            if (start >= 0 && end > start) {
                return trimmed.substring(start, end + 1);
            }
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }
}
