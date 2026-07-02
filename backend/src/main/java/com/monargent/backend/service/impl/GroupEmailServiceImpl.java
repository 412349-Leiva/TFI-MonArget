package com.monargent.backend.service.impl;

import com.monargent.backend.dto.group.GroupResponse;
import com.monargent.backend.dto.group.GroupSettlementResponse;
import com.monargent.backend.entity.Group;
import com.monargent.backend.entity.GroupGuestMember;
import com.monargent.backend.entity.User;
import com.monargent.backend.service.GroupEmailService;
import com.monargent.backend.service.GuestPayUrlService;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupEmailServiceImpl implements GroupEmailService {

    private final JavaMailSender mailSender;
    private final GuestPayUrlService guestPayUrlService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.properties.mail.smtp.from:noreply@monargent.app}")
    private String fromAddress;

    @Override
    public void sendGroupInviteEmail(String invitedEmail, User invitedBy, Group group) {
        String registerUrl = registerUrlFor(invitedEmail);
        String inviterName = invitedBy.getName();
        String groupTitle = group.getTitle();
        String subject = "MonArgent — Invitación al grupo \"" + groupTitle + "\"";

        String plainText = """
            MonArgent
            Invitación al grupo

            %s te invitó al grupo "%s" en MonArgent.

            Creá tu cuenta para unirte y gestionar los gastos del grupo:
            %s

            Si ya tenés cuenta, iniciá sesión con este correo y aceptá la invitación desde la app.

            Saludos,
            el equipo de MonArgent
            """.formatted(inviterName, groupTitle, registerUrl);

        String html = MonargentEmailTemplate.buildEmail(
            "Invitación al grupo",
            """
                <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
                  <strong style="color:#0f2543;">%s</strong> te invitó al grupo
                  <strong style="color:#0f2543;">&quot;%s&quot;</strong> en MonArgent.
                </p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
                  Creá tu cuenta para unirte y gestionar los gastos del grupo.
                </p>
                %s
                <p style="margin:24px 0 0;font-size:14px;line-height:1.55;color:#64748b;text-align:center;">
                  Si ya tenés cuenta, iniciá sesión con este correo y aceptá la invitación desde la app.
                </p>
                """.formatted(
                MonargentEmailTemplate.escapeHtml(inviterName),
                MonargentEmailTemplate.escapeHtml(groupTitle),
                MonargentEmailTemplate.buildCtaButton("Creá tu cuenta", registerUrl)
            )
        );

        sendHtml(invitedEmail, subject, plainText, html);
    }

    @Override
    public void sendGuestAddedEmail(GroupGuestMember guest, Group group) {
        String registerUrl = registerUrlFor(guest.getEmail());
        String displayName = guest.getDisplayName();
        String groupTitle = group.getTitle();
        String subject = "MonArgent — Te agregaron al grupo \"" + groupTitle + "\"";

        String plainText = """
            MonArgent
            Te agregaron a un grupo

            Hola %s,

            Fuiste agregado al grupo "%s" en MonArgent.

            Cuando se confirme la liquidación, te enviaremos el detalle de lo que debés.

            Registrate en MonArgent para gestionar tus gastos grupales:
            %s

            Saludos,
            el equipo de MonArgent
            """.formatted(displayName, groupTitle, registerUrl);

        String html = MonargentEmailTemplate.buildEmail(
            "Te agregaron a un grupo",
            """
                <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
                  Hola <strong style="color:#0f2543;">%s</strong>,
                </p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
                  Fuiste agregado al grupo <strong style="color:#0f2543;">&quot;%s&quot;</strong> en MonArgent.
                </p>
                %s
                <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
                  Registrate en MonArgent para gestionar tus gastos grupales.
                </p>
                %s
                """.formatted(
                MonargentEmailTemplate.escapeHtml(displayName),
                MonargentEmailTemplate.escapeHtml(groupTitle),
                MonargentEmailTemplate.buildInfoBox(
                    "Cuando se confirme la liquidación, te enviaremos el detalle de lo que debés."
                ),
                MonargentEmailTemplate.buildCtaButton("Registrate en MonArgent", registerUrl)
            )
        );

        sendHtml(guest.getEmail(), subject, plainText, html);
    }

    @Override
    public void sendGuestDebtSummary(GroupGuestMember guest, Group group, GroupResponse groupDetail) {
        if (guest.getEmail() == null || guest.getEmail().isBlank()) {
            return;
        }

        String registerUrl = registerUrlFor(guest.getEmail());
        String displayName = guest.getDisplayName();
        String groupTitle = group.getTitle();
        String guestMemberKey = "guest-" + guest.getId();
        List<GroupSettlementResponse> debts = groupDetail.getSettlements().stream()
            .filter(settlement -> guestMemberKey.equals(settlement.getFromMemberKey()))
            .toList();

        StringBuilder plainDebts = new StringBuilder();
        StringBuilder htmlDebts = new StringBuilder();

        if (debts.isEmpty()) {
            plainDebts.append("No tenés deudas pendientes en este grupo.\n");
            htmlDebts.append(
                MonargentEmailTemplate.buildInfoBox("No tenés deudas pendientes en este grupo.")
            );
        } else {
            plainDebts.append("Resumen de lo que debés:\n\n");
            NumberFormat currency = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-AR"));

            htmlDebts.append(
                """
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#475569;font-weight:600;">
                  Resumen de lo que debés:
                </p>
                """
            );

            for (GroupSettlementResponse debt : debts) {
                String amountText = currency.format(debt.getAmount());
                String creditorNick = debt.getToNick();
                String alias = debt.getToMpAlias();
                String payPageUrl = guestPayUrlService.buildGuestPayPageUrl(
                    debt.getToMpAlias(),
                    debt.getToNick(),
                    debt.getAmount(),
                    group.getTitle()
                );

                plainDebts.append("• Debés ").append(amountText).append(" a ").append(creditorNick);
                if (alias != null && !alias.isBlank()) {
                    plainDebts.append(" (alias: ").append(alias).append(")");
                }
                plainDebts.append("\n  Pagar: ").append(payPageUrl).append("\n\n");

                String aliasHtml = alias != null && !alias.isBlank()
                    ? " <span style=\"color:#64748b;\">(alias: " + MonargentEmailTemplate.escapeHtml(alias) + ")</span>"
                    : "";

                htmlDebts.append(
                    MonargentEmailTemplate.buildDebtCard(
                        MonargentEmailTemplate.escapeHtml(amountText),
                        MonargentEmailTemplate.escapeHtml(creditorNick),
                        aliasHtml,
                        MonargentEmailTemplate.buildCtaButton("Pagar", payPageUrl)
                    )
                );
            }
        }

        String subject = "MonArgent — Liquidación del grupo \"" + groupTitle + "\"";
        String plainText = """
            MonArgent
            Liquidación del grupo

            Hola %s,

            La liquidación del grupo "%s" está lista.

            %s
            Registrate en MonArgent:
            %s

            Saludos,
            el equipo de MonArgent
            """.formatted(displayName, groupTitle, plainDebts, registerUrl);

        String html = MonargentEmailTemplate.buildEmail(
            "Liquidación del grupo",
            """
                <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
                  Hola <strong style="color:#0f2543;">%s</strong>,
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#475569;">
                  La liquidación del grupo <strong style="color:#0f2543;">&quot;%s&quot;</strong> está lista.
                </p>
                %s
                <p style="margin:28px 0 20px;font-size:15px;line-height:1.65;color:#475569;">
                  Registrate en MonArgent para gestionar tus gastos grupales.
                </p>
                %s
                """.formatted(
                MonargentEmailTemplate.escapeHtml(displayName),
                MonargentEmailTemplate.escapeHtml(groupTitle),
                htmlDebts,
                MonargentEmailTemplate.buildCtaButton("Registrate en MonArgent", registerUrl)
            )
        );

        sendHtml(guest.getEmail(), subject, plainText, html);
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
        String groupTitle = group.getTitle();
        String subject = "MonArgent — Comprobante en \"" + groupTitle + "\"";

        String plainText;
        String htmlBody;

        if (creditorHasApp) {
            String groupsUrl = frontendUrl + "/groups";
            plainText = """
                MonArgent
                Comprobante de pago

                Hola %s,

                %s subió un comprobante de %s en el grupo "%s".

                Entrá a MonArgent para revisarlo y confirmar el pago:
                %s

                Saludos,
                el equipo de MonArgent
                """.formatted(creditorName, debtorName, amountText, groupTitle, groupsUrl);

            htmlBody = """
                <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
                  Hola <strong style="color:#0f2543;">%s</strong>,
                </p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
                  <strong style="color:#0f2543;">%s</strong> subió un comprobante de
                  <strong style="color:#D9B44A;">%s</strong> en el grupo
                  <strong style="color:#0f2543;">&quot;%s&quot;</strong>.
                </p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
                  Entrá a MonArgent para revisarlo y confirmar el pago.
                </p>
                %s
                """.formatted(
                MonargentEmailTemplate.escapeHtml(creditorName),
                MonargentEmailTemplate.escapeHtml(debtorName),
                MonargentEmailTemplate.escapeHtml(amountText),
                MonargentEmailTemplate.escapeHtml(groupTitle),
                MonargentEmailTemplate.buildCtaButton("Revisar en MonArgent", groupsUrl)
            );
        } else {
            plainText = """
                MonArgent
                Comprobante de pago

                Hola %s,

                %s registró un pago de %s en el grupo "%s".

                Saludos,
                el equipo de MonArgent
                """.formatted(creditorName, debtorName, amountText, groupTitle);

            htmlBody = """
                <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
                  Hola <strong style="color:#0f2543;">%s</strong>,
                </p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
                  <strong style="color:#0f2543;">%s</strong> registró un pago de
                  <strong style="color:#D9B44A;">%s</strong> en el grupo
                  <strong style="color:#0f2543;">&quot;%s&quot;</strong>.
                </p>
                """.formatted(
                MonargentEmailTemplate.escapeHtml(creditorName),
                MonargentEmailTemplate.escapeHtml(debtorName),
                MonargentEmailTemplate.escapeHtml(amountText),
                MonargentEmailTemplate.escapeHtml(groupTitle)
            );
        }

        String html = MonargentEmailTemplate.buildEmail("Comprobante de pago", htmlBody);
        sendHtml(creditorEmail, subject, plainText, html);
    }

    @Override
    public void sendGuestSettlementConfirmEmail(
        GroupGuestMember guest,
        Group group,
        BigDecimal amount,
        String confirmToken
    ) {
        String displayName = guest.getDisplayName();
        String groupTitle = group.getTitle();
        NumberFormat currency = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-AR"));
        String amountText = currency.format(amount);
        String confirmUrl = frontendUrl + "/pagar/confirmar?token=" + confirmToken;
        String registerUrl = registerUrlFor(guest.getEmail());
        String subject = "MonArgent — Confirmá que recibiste el pago en \"" + groupTitle + "\"";

        String plainText = """
            MonArgent
            Confirmación de cobro

            Hola %s,

            Alguien del grupo "%s" registró un pago de %s a tu favor.

            Confirmá que recibiste el dinero:
            %s

            Si todavía no tenés cuenta, podés registrarte acá:
            %s

            Saludos,
            el equipo de MonArgent
            """.formatted(displayName, groupTitle, amountText, confirmUrl, registerUrl);

        String htmlBody = """
            <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569;">
              Hola <strong style="color:#0f2543;">%s</strong>,
            </p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">
              Se registró un pago de <strong style="color:#D9B44A;">%s</strong> en el grupo
              <strong style="color:#0f2543;">&quot;%s&quot;</strong>.
              Confirmá que recibiste el dinero para cerrar la liquidación.
            </p>
            %s
            <p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:#64748b;">
              ¿Todavía no usás MonArgent? Registrate para ver tus grupos y movimientos.
            </p>
            %s
            """.formatted(
            MonargentEmailTemplate.escapeHtml(displayName),
            MonargentEmailTemplate.escapeHtml(amountText),
            MonargentEmailTemplate.escapeHtml(groupTitle),
            MonargentEmailTemplate.buildCtaButton("Confirmar cobro recibido", confirmUrl),
            MonargentEmailTemplate.buildCtaButton("Crear cuenta", registerUrl)
        );

        String html = MonargentEmailTemplate.buildEmail("Confirmar cobro", htmlBody);
        sendHtml(guest.getEmail(), subject, plainText, html);
    }

    private String registerUrlFor(String email) {
        if (email == null || email.isBlank()) {
            return frontendUrl + "/register";
        }
        return frontendUrl + "/register?email=" + URLEncoder.encode(email.trim(), StandardCharsets.UTF_8);
    }

    private void sendHtml(String to, String subject, String plainText, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(plainText, html);
            mailSender.send(message);
            log.info("Group email sent to {}", to);
        } catch (Exception ex) {
            log.warn("DEV MODE - GROUP EMAIL to {}:\n{}", to, plainText);
        }
    }
}
