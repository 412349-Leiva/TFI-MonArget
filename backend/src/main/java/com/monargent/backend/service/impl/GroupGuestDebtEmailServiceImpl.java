package com.monargent.backend.service.impl;

import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSettlementResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.service.GroupGuestDebtEmailService;
import com.monargent.backend.service.GuestPayUrlService;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupGuestDebtEmailServiceImpl implements GroupGuestDebtEmailService {

    private final JavaMailSender mailSender;
    private final GuestPayUrlService guestPayUrlService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void sendGuestDebtSummary(GroupGuestMember guest, Group group, GroupResponse groupDetail) {
        if (guest.getEmail() == null || guest.getEmail().isBlank()) {
            return;
        }

        String guestMemberKey = "guest-" + guest.getId();
        List<GroupSettlementResponse> debts = groupDetail.getSettlements().stream()
            .filter(settlement -> guestMemberKey.equals(settlement.getFromMemberKey()))
            .toList();

        StringBuilder body = new StringBuilder();
        body.append("Hola ").append(guest.getDisplayName()).append(",\n\n");
        body.append("Fuiste agregado al grupo \"").append(group.getTitle()).append("\" en MonArgent.\n\n");

        if (debts.isEmpty()) {
            body.append("Por ahora no tenés deudas pendientes en este grupo.\n\n");
        } else {
            body.append("Resumen de lo que debés (reparto equitativo):\n\n");
            NumberFormat currency = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-AR"));

            for (GroupSettlementResponse debt : debts) {
                String amountText = currency.format(debt.getAmount());
                body.append("• Debés ").append(amountText).append(" a ").append(debt.getToNick());
                if (debt.getToMpAlias() != null && !debt.getToMpAlias().isBlank()) {
                    body.append(" (alias: ").append(debt.getToMpAlias()).append(")");
                }
                body.append("\n");

                String payPageUrl = guestPayUrlService.buildGuestPayPageUrl(
                    debt.getToMpAlias(),
                    debt.getToNick(),
                    debt.getAmount(),
                    group.getTitle()
                );
                body.append("  Ver instrucciones de pago: ").append(payPageUrl).append("\n\n");
            }
        }

        body.append("Registrate en MonArgent para gestionar tus gastos grupales:\n");
        body.append(frontendUrl).append("/register\n\n");
        body.append("— MonArgent\n");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(guest.getEmail().trim());
            message.setSubject("MonArgent - Gastos del grupo \"" + group.getTitle() + "\"");
            message.setText(body.toString());
            mailSender.send(message);
            log.info("Guest debt email sent to {}", guest.getEmail());
        } catch (Exception ex) {
            log.warn("DEV MODE - GUEST DEBT EMAIL to {}:\n{}", guest.getEmail(), body);
        }
    }
}
