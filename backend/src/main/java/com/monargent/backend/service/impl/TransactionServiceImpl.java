package com.monargent.backend.service.impl;

import com.monargent.backend.dto.importation.ImportMovementItemRequest;
import com.monargent.backend.dto.transaction.TransactionCreateRequest;
import com.monargent.backend.dto.transaction.TransactionResponse;
import com.monargent.backend.dto.transaction.TransactionUpdateRequest;
import com.monargent.backend.entity.Category;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupExpense;
import com.monargent.backend.entity.Receipt;
import com.monargent.backend.entity.SavingGoal;
import com.monargent.backend.entity.Transaction;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CategoryType;
import com.monargent.backend.service.SpendingLimitAlertHelper;
import com.monargent.backend.enums.TransactionType;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.mapper.TransactionMapper;
import com.monargent.backend.repository.CategoryRepository;
import com.monargent.backend.repository.SpendingLimitRepository;
import com.monargent.backend.repository.TransactionRepository;
import com.monargent.backend.repository.specification.TransactionSpecifications;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.TransactionService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final SpendingLimitRepository spendingLimitRepository;
    private final CurrentUserService currentUserService;
    private final SpendingLimitAlertHelper spendingLimitAlertHelper;
    private final TransactionMapper transactionMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> findAll(Integer month, Integer year, Long categoryId, TransactionType type) {
        Long userId = currentUserService.getCurrentUserId();
        Specification<Transaction> specification = TransactionSpecifications.hasUserId(userId);

        if (month != null) {
            int resolvedYear = year != null ? year : LocalDate.now().getYear();
            specification = specification.and(TransactionSpecifications.hasMonth(month))
                .and(TransactionSpecifications.hasYear(resolvedYear));
        } else if (year != null) {
            specification = specification.and(TransactionSpecifications.hasYear(year));
        }

        if (categoryId != null) {
            specification = specification.and(TransactionSpecifications.hasCategoryId(categoryId));
        }

        if (type != null) {
            specification = specification.and(TransactionSpecifications.hasType(type));
        }

        return transactionRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "date")).stream()
            .map(transactionMapper::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionResponse getById(Long id) {
        Transaction transaction = transactionRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        return transactionMapper.toResponse(transaction);
    }

    @Override
    public TransactionResponse create(TransactionCreateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (!category.getType().name().equals(request.getType().name())) {
            throw new InvalidRequestException("Transaction type must match the category type");
        }

        Transaction transaction = transactionMapper.toEntity(request, category);
        transaction.setUser(currentUserService.getCurrentUser());
        Transaction saved = transactionRepository.save(transaction);

        if (saved.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(userId, category.getId(), saved.getDate().getMonthValue(), saved.getDate().getYear(), saved.getAmount());
        }

        return transactionMapper.toResponse(saved);
    }

    @Override
    public TransactionResponse createFromImport(ImportMovementItemRequest request, Category category, Receipt receipt) {
        Long userId = currentUserService.getCurrentUserId();

        if (!category.getType().name().equals(request.getType().name())) {
            throw new InvalidRequestException("Transaction type must match the category type");
        }

        LocalDateTime transactionDate = request.getDate() != null
            ? request.getDate().atStartOfDay()
            : LocalDateTime.now();

        Transaction transaction = Transaction.builder()
            .title(request.getDescription().trim())
            .description("")
            .amount(request.getAmount())
            .date(transactionDate)
            .type(request.getType())
            .category(category)
            .receipt(receipt)
            .user(currentUserService.getCurrentUser())
            .build();

        Transaction saved = transactionRepository.save(transaction);

        if (saved.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(userId, category.getId(), saved.getDate().getMonthValue(), saved.getDate().getYear(), saved.getAmount());
        }

        return transactionMapper.toResponse(saved);
    }

    @Override
    public TransactionResponse createFromSavingGoalDeposit(SavingGoal goal, BigDecimal amount) {
        Long userId = currentUserService.getCurrentUserId();
        validateMonthlyAvailableBalance(userId, amount);

        Category category = resolveSavingsCategory(userId);
        LocalDateTime now = LocalDateTime.now();

        Transaction transaction = Transaction.builder()
            .title("Depósito objetivo: " + goal.getTitle())
            .description("Asignación de fondos a objetivo de ahorro")
            .amount(amount)
            .date(now)
            .type(TransactionType.EXPENSE)
            .category(category)
            .user(currentUserService.getCurrentUser())
            .build();

        Transaction saved = transactionRepository.save(transaction);
        updateSpendingLimit(userId, category.getId(), now.getMonthValue(), now.getYear(), saved.getAmount());
        return transactionMapper.toResponse(saved);
    }

    @Override
    public void createFromGroupSettlement(
        User user,
        TransactionType type,
        BigDecimal amount,
        String groupTitle,
        String counterpartyNick,
        Long sourceGroupId
    ) {
        Category category = resolveGroupSettlementCategory(user, type);
        LocalDateTime now = LocalDateTime.now();
        String direction = type == TransactionType.EXPENSE ? "Pago a" : "Cobro de";
        String title = direction + " " + counterpartyNick + " — " + groupTitle;

        Transaction transaction = Transaction.builder()
            .title(title)
            .description("Liquidación de gasto grupal")
            .amount(amount)
            .date(now)
            .type(type)
            .category(category)
            .user(user)
            .sourceGroupId(sourceGroupId)
            .build();

        Transaction saved = transactionRepository.save(transaction);

        if (saved.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(user.getId(), category.getId(), now.getMonthValue(), now.getYear(), saved.getAmount());
        }
    }

    @Override
    public void createFromGroupExpense(User user, Group group, GroupExpense expense) {
        Category category = resolveGroupExpenseCategory(user);
        String itemCategory = expense.getCategory() != null ? expense.getCategory().getName() : null;
        String description = itemCategory != null
            ? "Gasto grupal — " + group.getTitle() + " (" + itemCategory + ")"
            : "Gasto grupal — " + group.getTitle();

        Transaction transaction = Transaction.builder()
            .title(expense.getTitle())
            .description(description)
            .amount(expense.getAmount())
            .date(expense.getDate())
            .type(TransactionType.EXPENSE)
            .category(category)
            .user(user)
            .groupExpenseId(expense.getId())
            .sourceGroupId(group.getId())
            .build();

        Transaction saved = transactionRepository.save(transaction);
        updateSpendingLimit(
            user.getId(),
            category.getId(),
            saved.getDate().getMonthValue(),
            saved.getDate().getYear(),
            saved.getAmount()
        );
    }

    @Override
    public void deleteBySourceGroupId(Long groupId) {
        List<Transaction> linked = transactionRepository.findAllBySourceGroupId(groupId);
        for (Transaction transaction : linked) {
            if (transaction.getType() == TransactionType.EXPENSE) {
                updateSpendingLimit(
                    transaction.getUser().getId(),
                    transaction.getCategory().getId(),
                    transaction.getDate().getMonthValue(),
                    transaction.getDate().getYear(),
                    transaction.getAmount().negate()
                );
            }
        }
        transactionRepository.deleteAllBySourceGroupId(groupId);
    }

    private Category resolveGroupExpenseCategory(User user) {
        return categoryRepository.findByUserIdAndNameIgnoreCaseAndType(
                user.getId(), "Gastos grupales", CategoryType.EXPENSE)
            .orElseGet(() -> categoryRepository.save(Category.builder()
                .name("Gastos grupales")
                .type(CategoryType.EXPENSE)
                .color("#F87171")
                .user(user)
                .build()));
    }

    private Category resolveGroupSettlementCategory(User user, TransactionType type) {
        CategoryType categoryType = type == TransactionType.EXPENSE ? CategoryType.EXPENSE : CategoryType.INCOME;
        String categoryName = type == TransactionType.EXPENSE ? "Gastos grupales" : "Grupos";
        return categoryRepository.findByUserIdAndNameIgnoreCaseAndType(user.getId(), categoryName, categoryType)
            .orElseGet(() -> categoryRepository.save(Category.builder()
                .name(categoryName)
                .type(categoryType)
                .color(type == TransactionType.EXPENSE ? "#F87171" : "#34D399")
                .user(user)
                .build()));
    }

    private void validateMonthlyAvailableBalance(Long userId, BigDecimal amount) {
        LocalDate today = LocalDate.now();
        List<Transaction> monthlyTransactions = transactionRepository.findAllByUserIdAndMonthAndYear(
            userId, today.getMonthValue(), today.getYear());

        BigDecimal income = monthlyTransactions.stream()
            .filter(tx -> tx.getType() == TransactionType.INCOME)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expenses = monthlyTransactions.stream()
            .filter(tx -> tx.getType() == TransactionType.EXPENSE)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal available = income.subtract(expenses);
        if (available.compareTo(amount) < 0) {
            throw new InvalidRequestException("Saldo insuficiente para realizar el depósito");
        }
    }

    private Category resolveSavingsCategory(Long userId) {
        return categoryRepository.findByUserIdAndNameIgnoreCaseAndType(userId, "Ahorros", CategoryType.EXPENSE)
            .orElseGet(() -> categoryRepository.save(Category.builder()
                .name("Ahorros")
                .type(CategoryType.EXPENSE)
                .color("#D9B44A")
                .user(currentUserService.getCurrentUser())
                .build()));
    }

    @Override
    public TransactionResponse update(Long id, TransactionUpdateRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        Category category = categoryRepository.findByIdAndUserId(request.getCategoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (!category.getType().name().equals(request.getType().name())) {
            throw new InvalidRequestException("Transaction type must match the category type");
        }

        // Reverse old spending limit contribution before applying updated values
        if (transaction.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(userId, transaction.getCategory().getId(),
                transaction.getDate().getMonthValue(), transaction.getDate().getYear(),
                transaction.getAmount().negate());
        }

        transactionMapper.updateEntity(transaction, request, category);
        Transaction saved = transactionRepository.save(transaction);

        if (saved.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(userId, category.getId(), saved.getDate().getMonthValue(), saved.getDate().getYear(), saved.getAmount());
        }

        return transactionMapper.toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        Long userId = currentUserService.getCurrentUserId();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));

        if (transaction.getType() == TransactionType.EXPENSE) {
            updateSpendingLimit(userId, transaction.getCategory().getId(),
                transaction.getDate().getMonthValue(), transaction.getDate().getYear(),
                transaction.getAmount().negate());
        }

        transactionRepository.delete(transaction);
    }

    private void updateSpendingLimit(Long userId, Long categoryId, int month, int year, BigDecimal delta) {
        spendingLimitRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, categoryId, month, year)
            .ifPresent(limit -> {
                BigDecimal previous = limit.getCurrentAmount();
                BigDecimal updated = previous.add(delta).max(BigDecimal.ZERO);
                limit.setCurrentAmount(updated);
                spendingLimitRepository.save(limit);
                spendingLimitAlertHelper.checkAndNotify(limit, previous, updated);
            });
    }
}