package com.monargent.backend.service.impl;

import com.monargent.backend.dto.importation.ExtractedMovementDTO;
import com.monargent.backend.dto.importation.ImportConfirmRequest;
import com.monargent.backend.dto.importation.ImportMovementItemRequest;
import com.monargent.backend.dto.importation.ImportPreviewResponse;
import com.monargent.backend.dto.importation.ImportSummaryResponse;
import com.monargent.backend.dto.transaction.TransactionResponse;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.Receipt;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.enums.ImportSourceType;
import com.monargent.backend.enums.ReceiptStatus;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.ReceiptRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.FinancialExtractionAIService;
import com.monargent.backend.service.ImportService;
import com.monargent.backend.service.OCRSpaceService;
import com.monargent.backend.service.TransactionService;
import com.monargent.backend.utils.ExcelMovementParser;
import com.monargent.backend.utils.ImportFileUtils;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ImportServiceImpl implements ImportService {

    private final OCRSpaceService ocrSpaceService;
    private final FinancialExtractionAIService financialExtractionAIService;
    private final TransactionService transactionService;
    private final CategoryRepository categoryRepository;
    private final ReceiptRepository receiptRepository;
    private final CurrentUserService currentUserService;

    @Override
    @Transactional(readOnly = true)
    public ImportPreviewResponse extract(MultipartFile file) {
        ImportSourceType sourceType = ImportFileUtils.detectSourceType(file);
        String fileName = file.getOriginalFilename() == null ? "archivo" : file.getOriginalFilename();

        List<ExtractedMovementDTO> movements = switch (sourceType) {
            case IMAGE, PDF -> extractFromOcr(file);
            case EXCEL -> extractFromExcel(file);
        };

        enrichWithSuggestedCategories(movements);

        return ImportPreviewResponse.builder()
            .sourceFileName(fileName)
            .sourceType(sourceType)
            .movements(movements)
            .build();
    }

    @Override
    public ImportSummaryResponse confirm(ImportConfirmRequest request) {
        if (request.getMovements() == null || request.getMovements().isEmpty()) {
            throw new InvalidRequestException("Debe confirmar al menos un movimiento");
        }

        User user = currentUserService.getCurrentUser();
        Long userId = user.getId();

        Receipt receipt = receiptRepository.save(Receipt.builder()
            .user(user)
            .status(ReceiptStatus.CONFIRMED)
            .detectedCommerce(request.getSourceFileName())
            .build());

        List<TransactionResponse> savedTransactions = new ArrayList<>();
        int incomes = 0;
        int expenses = 0;
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (ImportMovementItemRequest item : request.getMovements()) {
            Category category = resolveCategory(userId, item);
            TransactionResponse saved = transactionService.createFromImport(item, category, receipt);
            savedTransactions.add(saved);

            if (saved.getType() == TransactionType.INCOME) {
                incomes++;
                totalIncome = totalIncome.add(saved.getAmount());
            } else {
                expenses++;
                totalExpense = totalExpense.add(saved.getAmount());
            }
        }

        BigDecimal detectedAmount = totalIncome.subtract(totalExpense).abs();
        receipt.setDetectedAmount(detectedAmount);
        receiptRepository.save(receipt);

        return ImportSummaryResponse.builder()
            .totalImported(savedTransactions.size())
            .incomes(incomes)
            .expenses(expenses)
            .totalIncome(totalIncome)
            .totalExpense(totalExpense)
            .receiptId(receipt.getId())
            .transactions(savedTransactions)
            .build();
    }

    private List<ExtractedMovementDTO> extractFromOcr(MultipartFile file) {
        String rawText = ocrSpaceService.extractRawText(file);
        log.info("[OCR-DIAG] Extracted text before AI processing (length={} chars):\n{}",
            rawText != null ? rawText.length() : 0, rawText);
        if (rawText == null || rawText.isBlank()) {
            throw new InvalidRequestException("No se pudo extraer texto del documento");
        }
        List<ExtractedMovementDTO> movements = financialExtractionAIService.extractMovements(rawText);
        log.info("[OCR-DIAG] Movements returned to preview after OCR+AI pipeline: {}", movements.size());
        if (movements.isEmpty()) {
            throw new InvalidRequestException(
                "No se detectaron productos en el ticket. Probá con una imagen más nítida o revisá la configuración de Gemini."
            );
        }
        return movements;
    }

    private List<ExtractedMovementDTO> extractFromExcel(MultipartFile file) {
        try {
            return ExcelMovementParser.parse(file);
        } catch (Exception ex) {
            log.error("Excel parsing failed", ex);
            throw new InvalidRequestException("No se pudo leer el archivo Excel");
        }
    }

    private void enrichWithSuggestedCategories(List<ExtractedMovementDTO> movements) {
        Long userId = currentUserService.getCurrentUserId();
        for (ExtractedMovementDTO movement : movements) {
            if (movement.getSuggestedCategory() == null || movement.getSuggestedCategory().isBlank()) {
                continue;
            }
            CategoryType categoryType = movement.getType() == TransactionType.INCOME
                ? CategoryType.INCOME
                : CategoryType.EXPENSE;
            categoryRepository.findByUserIdAndNameIgnoreCaseAndType(userId, movement.getSuggestedCategory().trim(), categoryType)
                .ifPresent(category -> movement.setSuggestedCategoryId(category.getId()));
        }
    }

    private Category resolveCategory(Long userId, ImportMovementItemRequest item) {
        CategoryType categoryType = item.getType() == TransactionType.INCOME
            ? CategoryType.INCOME
            : CategoryType.EXPENSE;

        if (item.getCategoryId() != null) {
            return categoryRepository.findByIdAndUserId(item.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        String categoryName = item.getCategoryName();
        if (categoryName == null || categoryName.isBlank()) {
            categoryName = "Otros";
        }
        categoryName = categoryName.trim();

        String finalCategoryName = categoryName;
        return categoryRepository.findByUserIdAndNameIgnoreCaseAndType(userId, finalCategoryName, categoryType)
            .orElseGet(() -> categoryRepository.save(Category.builder()
                .name(finalCategoryName)
                .type(categoryType)
                .user(currentUserService.getCurrentUser())
                .build()));
    }
}
