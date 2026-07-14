package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.ReceiptRepository;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.FinancialExtractionAIService;
import com.monargent.backend.service.OCRSpaceService;
import com.monargent.backend.service.TransactionService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class ImportServiceImplTest {

    @Mock private OCRSpaceService ocrSpaceService;
    @Mock private FinancialExtractionAIService financialExtractionAIService;
    @Mock private TransactionService transactionService;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ReceiptRepository receiptRepository;
    @Mock private CurrentUserService currentUserService;

    @InjectMocks
    private ImportServiceImpl service;

    private User user;
    private Category expenseCategory;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("imp@example.com").password("x").verified(true).build();
        expenseCategory = Category.builder().id(10L).name("Comida").type(CategoryType.EXPENSE).user(user).build();
    }

    @Test
    void extract_imagePath_enrichesSuggestedCategory() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        MockMultipartFile file = new MockMultipartFile(
            "file", "ticket.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(ocrSpaceService.extractRawText(file)).thenReturn("SUPERMERCADO TOTAL 100");
        ExtractedMovementDTO movement = ExtractedMovementDTO.builder()
            .description("Leche").amount(new BigDecimal("10"))
            .type(TransactionType.EXPENSE).suggestedCategory("Comida").build();
        when(financialExtractionAIService.extractMovements(any())).thenReturn(List.of(movement));
        when(categoryRepository.findByUserIdAndNameIgnoreCaseAndType(1L, "Comida", CategoryType.EXPENSE))
            .thenReturn(Optional.of(expenseCategory));

        ImportPreviewResponse preview = service.extract(file);
        assertThat(preview.getSourceType()).isEqualTo(ImportSourceType.IMAGE);
        assertThat(preview.getMovements().get(0).getSuggestedCategoryId()).isEqualTo(10L);
    }

    @Test
    void extract_blankOcr_throws() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "ticket.png", "image/png", new byte[]{1});
        when(ocrSpaceService.extractRawText(file)).thenReturn("  ");
        assertThatThrownBy(() -> service.extract(file))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("No se pudo extraer texto del documento");
    }

    @Test
    void extract_noMovements_throws() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "ticket.pdf", "application/pdf", new byte[]{1});
        when(ocrSpaceService.extractRawText(file)).thenReturn("texto sin items");
        when(financialExtractionAIService.extractMovements(any())).thenReturn(List.of());
        assertThatThrownBy(() -> service.extract(file))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessageContaining("No se detectaron productos");
    }

    @Test
    void extract_trimsLongOcrText() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        MockMultipartFile file = new MockMultipartFile(
            "file", "ticket.jpg", "image/jpeg", new byte[]{1});
        String longText = "x".repeat(13_000);
        when(ocrSpaceService.extractRawText(file)).thenReturn(longText);
        when(financialExtractionAIService.extractMovements(any())).thenAnswer(inv -> {
            String sent = inv.getArgument(0);
            assertThat(sent).hasSize(12_000);
            return List.of(ExtractedMovementDTO.builder()
                .description("Item").amount(BigDecimal.ONE).type(TransactionType.EXPENSE).build());
        });

        assertThat(service.extract(file).getMovements()).hasSize(1);
    }

    @Test
    void confirm_empty_throws() {
        assertThatThrownBy(() -> service.confirm(ImportConfirmRequest.builder().movements(List.of()).build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Debe confirmar al menos un movimiento");
    }

    @Test
    void confirm_createsTransactions_andReceipt() {
        when(currentUserService.getCurrentUser()).thenReturn(user);
        ImportMovementItemRequest expense = ImportMovementItemRequest.builder()
            .description("Pan").amount(new BigDecimal("20")).type(TransactionType.EXPENSE)
            .date(LocalDate.now()).categoryId(10L).build();
        ImportMovementItemRequest income = ImportMovementItemRequest.builder()
            .description("Vuelto").amount(new BigDecimal("5")).type(TransactionType.INCOME)
            .categoryName("Otros").build();
        Receipt receipt = Receipt.builder().id(44L).user(user).build();
        when(receiptRepository.save(any(Receipt.class))).thenAnswer(inv -> {
            Receipt r = inv.getArgument(0);
            if (r.getId() == null) {
                r.setId(44L);
            }
            return r;
        });
        when(categoryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(expenseCategory));
        when(categoryRepository.findByUserIdAndNameIgnoreCaseAndType(1L, "Otros", CategoryType.INCOME))
            .thenReturn(Optional.empty());
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setId(99L);
            return c;
        });
        when(transactionService.createFromImport(eq(expense), eq(expenseCategory), any()))
            .thenReturn(TransactionResponse.builder().id(1L).type(TransactionType.EXPENSE)
                .amount(new BigDecimal("20")).build());
        when(transactionService.createFromImport(eq(income), any(Category.class), any()))
            .thenReturn(TransactionResponse.builder().id(2L).type(TransactionType.INCOME)
                .amount(new BigDecimal("5")).build());

        ImportSummaryResponse summary = service.confirm(ImportConfirmRequest.builder()
            .sourceFileName("ticket.jpg")
            .movements(List.of(expense, income))
            .build());

        assertThat(summary.getTotalImported()).isEqualTo(2);
        assertThat(summary.getExpenses()).isEqualTo(1);
        assertThat(summary.getIncomes()).isEqualTo(1);
        assertThat(summary.getReceiptId()).isEqualTo(44L);
        verify(receiptRepository, org.mockito.Mockito.atLeast(2)).save(any(Receipt.class));
    }

    @Test
    void confirm_wrongCategoryType_fallsBackToName() {
        when(currentUserService.getCurrentUser()).thenReturn(user);
        Category incomeCat = Category.builder().id(11L).name("Sueldo").type(CategoryType.INCOME).user(user).build();
        ImportMovementItemRequest item = ImportMovementItemRequest.builder()
            .description("Compra").amount(new BigDecimal("10")).type(TransactionType.EXPENSE)
            .categoryId(11L).categoryName("Comida").build();
        when(receiptRepository.save(any(Receipt.class))).thenAnswer(inv -> {
            Receipt r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });
        when(categoryRepository.findByIdAndUserId(11L, 1L)).thenReturn(Optional.of(incomeCat));
        when(categoryRepository.findByUserIdAndNameIgnoreCaseAndType(1L, "Comida", CategoryType.EXPENSE))
            .thenReturn(Optional.of(expenseCategory));
        when(transactionService.createFromImport(eq(item), eq(expenseCategory), any()))
            .thenReturn(TransactionResponse.builder().type(TransactionType.EXPENSE)
                .amount(new BigDecimal("10")).build());

        assertThat(service.confirm(ImportConfirmRequest.builder().movements(List.of(item)).build())
            .getExpenses()).isEqualTo(1);
    }

    @Test
    void confirm_categoryIdMissing_throws() {
        when(currentUserService.getCurrentUser()).thenReturn(user);
        ImportMovementItemRequest item = ImportMovementItemRequest.builder()
            .description("X").amount(BigDecimal.ONE).type(TransactionType.EXPENSE).categoryId(999L).build();
        when(receiptRepository.save(any(Receipt.class))).thenAnswer(inv -> {
            Receipt r = inv.getArgument(0);
            r.setId(1L);
            return r;
        });
        when(categoryRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.confirm(ImportConfirmRequest.builder().movements(List.of(item)).build()))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Categoría no encontrada");
    }
}
