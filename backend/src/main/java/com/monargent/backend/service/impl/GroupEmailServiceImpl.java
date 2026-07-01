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
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
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
        String registerUrl = frontendUrl + "/register";
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

        String html = buildBrandedEmail(
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
                escapeHtml(inviterName),
                escapeHtml(groupTitle),
                buildCtaButton("Creá tu cuenta", registerUrl)
            )
        );

        sendHtml(invitedEmail, subject, plainText, html);
    }

    @Override
    public void sendGuestAddedEmail(GroupGuestMember guest, Group group) {
        String registerUrl = frontendUrl + "/register";
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

        String html = buildBrandedEmail(
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
                escapeHtml(displayName),
                escapeHtml(groupTitle),
                buildInfoBox(
                    "Cuando se confirme la liquidación, te enviaremos el detalle de lo que debés."
                ),
                buildCtaButton("Registrate en MonArgent", registerUrl)
            )
        );

        sendHtml(guest.getEmail(), subject, plainText, html);
    }

    @Override
    public void sendGuestDebtSummary(GroupGuestMember guest, Group group, GroupResponse groupDetail) {
        if (guest.getEmail() == null || guest.getEmail().isBlank()) {
            return;
        }

        String registerUrl = frontendUrl + "/register";
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
                buildInfoBox("No tenés deudas pendientes en este grupo.")
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
                    ? " <span style=\"color:#64748b;\">(alias: " + escapeHtml(alias) + ")</span>"
                    : "";

                htmlDebts.append(
                    """
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="margin-bottom:14px;">
                      <tr>
                        <td style="background-color:#f8fafc;border-radius:6px;padding:16px 18px;border:1px solid #e2e8f0;">
                          <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155;">
                            Debés <strong style="color:#b45309;">%s</strong> a
                            <strong style="color:#0f2543;">%s</strong>%s
                          </p>
                          %s
                        </td>
                      </tr>
                    </table>
                    """.formatted(
                        escapeHtml(amountText),
                        escapeHtml(creditorNick),
                        aliasHtml,
                        buildCtaButton("Pagar", payPageUrl)
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

        String html = buildBrandedEmail(
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
                escapeHtml(displayName),
                escapeHtml(groupTitle),
                htmlDebts,
                buildCtaButton("Registrate en MonArgent", registerUrl)
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

    private String buildBrandedEmail(String heading, String bodyContent) {
        String safeHeading = escapeHtml(heading);
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta http-equiv="X-UA-Compatible" content="IE=edge" />
              <title>MonArgent</title>
            </head>
            <body style="margin:0;padding:24px 12px;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#334155;">
              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
                <tr>
                  <td style="background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:28px 32px 20px;text-align:center;border-bottom:3px solid #E8B923;">
                          <div style="font-size:28px;font-weight:700;color:#0f2543;letter-spacing:1px;">MonArgent</div>
                          <div style="font-size:12px;color:#64748b;margin-top:6px;letter-spacing:0.3px;">Gestión financiera personal</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px 32px 8px;">
                          <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#0f2543;font-weight:600;">%s</h1>
                          %s
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
                          <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#64748b;">
                            Saludos,<br />
                            <span style="color:#b45309;font-weight:600;">el equipo de MonArgent</span>
                          </p>
                          <div style="width:60px;height:3px;background-color:#E8B923;margin:0 auto;border-radius:2px;"></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 8px 0;text-align:center;">
                    <p style="margin:0;font-size:11px;line-height:1.4;color:#94a3b8;">
                      © MonArgent — Este es un mensaje automático, no respondas a este correo.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(safeHeading, bodyContent);
    }

    private String buildCtaButton(String label, String url) {
        String safeLabel = escapeHtml(label);
        String safeUrl = escapeHtml(url);
        return """
            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding:4px 0;">
                  <a href="%s" style="display:inline-block;background-color:#0f2543;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:6px;border-bottom:3px solid #E8B923;">
                    %s
                  </a>
                </td>
              </tr>
            </table>
            """.formatted(safeUrl, safeLabel);
    }

    private String buildInfoBox(String text) {
        return """
            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
              <tr>
                <td style="background-color:#f8fafc;border-radius:6px;border-left:4px solid #E8B923;padding:18px 20px;">
                  <p style="margin:0;font-size:14px;line-height:1.55;color:#475569;">%s</p>
                </td>
              </tr>
            </table>
            """.formatted(escapeHtml(text));
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }
}
