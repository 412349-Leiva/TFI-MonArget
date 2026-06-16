package com.monargent.backend.utils;

import com.monargent.backend.dto.importation.ExtractedMovementDTO;
import com.monargent.backend.enums.TransactionType;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.web.multipart.MultipartFile;

public final class ExcelMovementParser {

    private ExcelMovementParser() {
    }

    public static List<ExtractedMovementDTO> parse(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            if (!rows.hasNext()) {
                return List.of();
            }

            Row headerRow = rows.next();
            Map<String, Integer> columns = detectColumns(headerRow);
            boolean hasHeader = !columns.isEmpty();

            List<ExtractedMovementDTO> movements = new ArrayList<>();
            if (!hasHeader) {
                ExtractedMovementDTO movement = rowToMovement(headerRow, defaultColumns());
                if (movement != null) {
                    movements.add(movement);
                }
            }

            while (rows.hasNext()) {
                ExtractedMovementDTO movement = rowToMovement(rows.next(), hasHeader ? columns : defaultColumns());
                if (movement != null) {
                    movements.add(movement);
                }
            }
            return movements;
        }
    }

    private static Map<String, Integer> defaultColumns() {
        Map<String, Integer> columns = new HashMap<>();
        columns.put("description", 0);
        columns.put("amount", 1);
        columns.put("category", 2);
        columns.put("type", 3);
        columns.put("date", 4);
        return columns;
    }

    private static Map<String, Integer> detectColumns(Row headerRow) {
        Map<String, Integer> columns = new HashMap<>();
        for (Cell cell : headerRow) {
            String value = normalize(getStringCell(cell));
            if (value.isBlank()) {
                continue;
            }
            if (matches(value, "descripcion", "description", "producto", "item", "nombre", "concepto")) {
                columns.put("description", cell.getColumnIndex());
            } else if (matches(value, "monto", "precio", "importe", "amount", "valor")) {
                columns.put("amount", cell.getColumnIndex());
            } else if (matches(value, "categoria", "category", "rubro")) {
                columns.put("category", cell.getColumnIndex());
            } else if (matches(value, "tipo", "type", "movimiento")) {
                columns.put("type", cell.getColumnIndex());
            } else if (matches(value, "fecha", "date")) {
                columns.put("date", cell.getColumnIndex());
            }
        }
        return columns;
    }

    private static boolean matches(String value, String... options) {
        for (String option : options) {
            if (value.contains(option)) {
                return true;
            }
        }
        return false;
    }

    private static ExtractedMovementDTO rowToMovement(Row row, Map<String, Integer> columns) {
        if (row == null) {
            return null;
        }

        String description = getCellByKey(row, columns, "description");
        BigDecimal amount = getAmountByKey(row, columns, "amount");
        String category = getCellByKey(row, columns, "category");
        TransactionType type = parseType(getCellByKey(row, columns, "type"));
        LocalDate date = getDateByKey(row, columns, "date");

        if ((description == null || description.isBlank()) && amount == null) {
            return null;
        }

        return ExtractedMovementDTO.builder()
            .tempId(UUID.randomUUID().toString())
            .type(type)
            .description(description != null ? description : "")
            .suggestedCategory(category != null ? category : "")
            .amount(amount != null ? amount : BigDecimal.ZERO)
            .date(date)
            .build();
    }

    private static TransactionType parseType(String value) {
        if (value == null) {
            return TransactionType.EXPENSE;
        }
        String normalized = normalize(value);
        if (normalized.contains("ingreso") || normalized.contains("income") || normalized.equals("i")) {
            return TransactionType.INCOME;
        }
        return TransactionType.EXPENSE;
    }

    private static String getCellByKey(Row row, Map<String, Integer> columns, String key) {
        Integer index = columns.get(key);
        if (index == null) {
            return null;
        }
        return getStringCell(row.getCell(index));
    }

    private static BigDecimal getAmountByKey(Row row, Map<String, Integer> columns, String key) {
        Integer index = columns.get(key);
        if (index == null) {
            return null;
        }
        return getNumericCell(row.getCell(index));
    }

    private static LocalDate getDateByKey(Row row, Map<String, Integer> columns, String key) {
        Integer index = columns.get(key);
        if (index == null) {
            return null;
        }
        Cell cell = row.getCell(index);
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            Date date = cell.getDateCellValue();
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        String text = getStringCell(cell);
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(text);
        } catch (Exception ex) {
            return null;
        }
    }

    private static String getStringCell(Cell cell) {
        if (cell == null) {
            return null;
        }
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                ? cell.getLocalDateTimeCellValue().toLocalDate().toString()
                : String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield String.valueOf(cell.getNumericCellValue());
                } catch (Exception ex) {
                    yield cell.getStringCellValue();
                }
            }
            default -> null;
        };
    }

    private static BigDecimal getNumericCell(Cell cell) {
        if (cell == null) {
            return null;
        }
        return switch (cell.getCellType()) {
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING -> parseDecimal(cell.getStringCellValue());
            case FORMULA -> {
                try {
                    yield BigDecimal.valueOf(cell.getNumericCellValue());
                } catch (Exception ex) {
                    yield parseDecimal(cell.getStringCellValue());
                }
            }
            default -> null;
        };
    }

    private static BigDecimal parseDecimal(String value) {
        if (value == null) {
            return null;
        }
        try {
            String cleaned = value.replaceAll("[^0-9,.\\-]", "").replace(',', '.');
            if (cleaned.isBlank()) {
                return null;
            }
            return new BigDecimal(cleaned);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
