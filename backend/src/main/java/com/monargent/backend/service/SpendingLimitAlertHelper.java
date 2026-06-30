package com.monargent.backend.service;

import com.monargent.backend.entity.SpendingLimit;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.NotificationType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SpendingLimitAlertHelper {

    private static final int[] THRESHOLDS = {50, 75, 100};

    private final NotificationService notificationService;

    public void checkAndNotify(SpendingLimit limit, BigDecimal previousAmount, BigDecimal currentAmount) {
        if (limit == null || limit.getAmountLimit() == null
            || limit.getAmountLimit().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal previous = previousAmount == null ? BigDecimal.ZERO : previousAmount;
        BigDecimal current = currentAmount == null ? BigDecimal.ZERO : currentAmount;
        int prevPct = percentage(previous, limit.getAmountLimit());
        int currPct = percentage(current, limit.getAmountLimit());
        String category = limit.getCategory() != null ? limit.getCategory().getName() : "categoría";
        User user = limit.getUser();

        for (int threshold : THRESHOLDS) {
            if (prevPct < threshold && currPct >= threshold) {
                String message = buildMessage(category, threshold, current, limit.getAmountLimit());
                notificationService.createIfNotRecent(
                    user, NotificationType.ALERT, message, referenceId(limit.getId(), threshold), 23
                );
            }
        }
    }

    public void notifyHighestIfDue(SpendingLimit limit) {
        if (limit == null || limit.getAmountLimit() == null
            || limit.getAmountLimit().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        int pct = percentage(limit.getCurrentAmount(), limit.getAmountLimit());
        int highest = 0;
        for (int threshold : THRESHOLDS) {
            if (pct >= threshold) {
                highest = threshold;
            }
        }
        if (highest == 0) {
            return;
        }
        String category = limit.getCategory() != null ? limit.getCategory().getName() : "categoría";
        String message = buildMessage(category, highest, limit.getCurrentAmount(), limit.getAmountLimit());
        notificationService.createIfNotRecent(
            limit.getUser(), NotificationType.ALERT, message, referenceId(limit.getId(), highest), 23
        );
    }

    private long referenceId(Long limitId, int threshold) {
        return limitId * 10L + threshold;
    }

    private String buildMessage(String category, int threshold, BigDecimal current, BigDecimal limit) {
        String spent = formatMoney(current);
        String max = formatMoney(limit);
        if (threshold >= 100) {
            return "Superaste el límite de " + category + " este mes (" + spent + " / " + max + ").";
        }
        return "Llegaste al " + threshold + "% del límite de " + category + " (" + spent + " / " + max + ").";
    }

    private int percentage(BigDecimal current, BigDecimal limit) {
        if (current == null || limit == null || limit.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return current
            .multiply(BigDecimal.valueOf(100))
            .divide(limit, 0, RoundingMode.HALF_UP)
            .intValue();
    }

    private String formatMoney(BigDecimal amount) {
        return "$" + amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }
}
