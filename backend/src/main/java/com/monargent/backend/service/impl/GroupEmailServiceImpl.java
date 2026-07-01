package com.monargent.backend.service.impl;

import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSettlementResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.User;
import com.monargent.backend.service.GroupEmailService;
import com.monargent.backend.service.GuestPayUrlService;
import java.math.BigDecimal;
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
public class GroupEmailServiceImpl implements GroupEmailService {

    private final JavaMailSender mailSender;
    private final GuestPayUrlService guestPayUrlService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void sendGroupInviteEmail(String invitedEmail, User invitedBy, Group group) {
        String registerUrl = frontendUrl + "/register";
        String body = """
            Hola,

            %s te invitó al grupo "%s" en MonArgent.

            Creá tu cuenta para unirte y gestionar los gastos del grupo:
            %s

            Si ya tenés cuenta, iniciá sesión con este correo y aceptá la invitación desde la app.

            — MonArgent
            """.formatted(invitedBy.getName(), group.getTitle(), registerUrl);

        sendPlain(invitedEmail, "MonArgent — Invitación al grupo \"" + group.getTitle() + "\"", body);
    }

    @Override
    public void sendGuestAddedEmail(GroupGuestMember guest, Group group) {
        String registerUrl = frontendUrl + "/register";
        String body = """
            Hola %s,

            Fuiste agregado al grupo "%s" en MonArgent.

            Cuando se confirme la liquidación, te enviaremos el detalle de lo que debés.

            Registrate en MonArgent para gestionar tus gastos grupales:
            %s

            — MonArgent
            """.formatted(guest.getDisplayName(), group.getTitle(), registerUrl);

        sendPlain(guest.getEmail(), "MonArgent — Te agregaron al grupo \"" + group.getTitle() + "\"", body);
    }

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
        body.append("La liquidación del grupo \"").append(group.getTitle()).append("\" está lista.\n\n");

        if (debts.isEmpty()) {
            body.append("No tenés deudas pendientes en este grupo.\n\n");
        } else {
            body.append("Resumen de lo que debés:\n\n");
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
                body.append("  Pagar: ").append(payPageUrl).append("\n\n");
            }
        }

        body.append("Registrate en MonArgent:\n");
        body.append(frontendUrl).append("/register\n\n");
        body.append("— MonArgent\n");

        sendPlain(guest.getEmail(), "MonArgent - Liquidación del grupo \"" + group.getTitle() + "\"", body.toString());
    }

    @Override
    public void sendProofUploadedEmail(
        String creditorEmail,
        String creditorName,
        User debtor,
        Group group,
        BigDecimal amount,
        boolean creditorHasApp
    ) {
        if (creditorEmail == null || creditorEmail.isBlank()) {
            return;
        }

        NumberFormat currency = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-AR"));
        String amountText = currency.format(amount);
        String debtorName = debtor.getName() != null ? debtor.getName() : debtor.getEmail();

        String body;
        if (creditorHasApp) {
            body = """
                Hola %s,

                %s subió un comprobante de %s en el grupo "%s".

                Entrá a MonArgent para revisarlo y confirmar el pago:
                %s/groups

                — MonArgent
                """.formatted(creditorName, debtorName, amountText, group.getTitle(), frontendUrl);
        } else {
            body = """
                Hola %s,

                %s registró un pago de %s en el grupo "%s".

                — MonArgent
                """.formatted(creditorName, debtorName, amountText, group.getTitle());
        }

        sendPlain(creditorEmail, "MonArgent — Comprobante en \"" + group.getTitle() + "\"", body);
    }

    private void sendPlain(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to.trim());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Group email sent to {}", to);
        } catch (Exception ex) {
            log.warn("DEV MODE - GROUP EMAIL to {}:\n{}", to, body);
        }
    }
}
