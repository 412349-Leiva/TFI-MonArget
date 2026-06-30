package com.monargent.backend.service.impl;

import com.monargent.backend.enums.AuthEmailType;
import com.monargent.backend.service.AuthEmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthEmailServiceImpl implements AuthEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.properties.mail.smtp.from:noreply@monargent.app}")
    private String fromAddress;

    @Override
    public void sendAuthCodeEmail(String toEmail, String code, AuthEmailType type, int expirationMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(resolveSubject(type));
            helper.setText(
                buildPlainTextBody(code, type, expirationMinutes),
                buildHtmlBody(code, type, expirationMinutes)
            );
            mailSender.send(message);
            log.info("Auth email ({}) sent to {}", type, toEmail);
        } catch (Exception ex) {
            log.warn("Failed to send auth email to {} ({}). DEV fallback enabled.", toEmail, type, ex);
            System.out.println("==================================================");
            System.out.println("DEV MODE - " + resolveSubject(type));
            System.out.println("To: " + toEmail);
            System.out.println("CODE: " + code);
            System.out.println("Expires in " + expirationMinutes + " minutes");
            System.out.println("==================================================");
        }
    }

    private String resolveSubject(AuthEmailType type) {
        return switch (type) {
            case REGISTRATION -> "MonArgent — Verificá tu cuenta";
            case REGISTRATION_RESEND -> "MonArgent — Nuevo código de verificación";
            case PASSWORD_RESET -> "MonArgent — Restablecer contraseña";
        };
    }

    private String resolveHeading(AuthEmailType type) {
        return switch (type) {
            case REGISTRATION -> "Verificá tu cuenta";
            case REGISTRATION_RESEND -> "Nuevo código de verificación";
            case PASSWORD_RESET -> "Restablecé tu contraseña";
        };
    }

    private String resolveIntro(AuthEmailType type) {
        return switch (type) {
            case REGISTRATION ->
                "Gracias por registrarte en MonArgent. Ingresá el siguiente código para completar tu registro:";
            case REGISTRATION_RESEND ->
                "Solicitaste un nuevo código. Usalo para continuar con tu registro:";
            case PASSWORD_RESET ->
                "Recibimos una solicitud para restablecer tu contraseña. Ingresá este código para continuar:";
        };
    }

    private String resolveExpiryText(int expirationMinutes) {
        return expirationMinutes == 1 ? "1 minuto" : expirationMinutes + " minutos";
    }

    private String buildPlainTextBody(String code, AuthEmailType type, int expirationMinutes) {
        String expiryText = resolveExpiryText(expirationMinutes);
        return """
            MonArgent
            %s

            %s

            Tu código: %s

            Este código vence en %s.

            SEGURIDAD
            - Si no fuiste vos quien solicitó este código, ignorá este mensaje.
            - No compartas este código con nadie.
            - MonArgent nunca te pedirá tu contraseña por email.

            Saludos,
            el equipo de MonArgent
            """.formatted(resolveHeading(type), resolveIntro(type), code, expiryText);
    }

    private String buildHtmlBody(String code, AuthEmailType type, int expirationMinutes) {
        String heading = escapeHtml(resolveHeading(type));
        String intro = escapeHtml(resolveIntro(type));
        String safeCode = escapeHtml(code);
        String expiryText = escapeHtml(resolveExpiryText(expirationMinutes));

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
                          <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">%s</p>
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center" style="background-color:#fffbeb;border-radius:6px;padding:28px 20px;border:1px solid #fde68a;">
                                <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#92400e;margin-bottom:12px;">Tu código</div>
                                <div style="font-size:42px;font-weight:700;letter-spacing:10px;color:#b45309;font-family:'Courier New',Courier,monospace;line-height:1.2;">%s</div>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:22px 0 0;font-size:14px;line-height:1.5;color:#64748b;text-align:center;">
                            Este código vence en <strong style="color:#334155;">%s</strong>.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 32px 28px;">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border-radius:6px;border-left:4px solid #E8B923;">
                            <tr>
                              <td style="padding:18px 20px;">
                                <p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:#475569;">
                                  <strong style="color:#0f2543;">¿No fuiste vos?</strong><br />
                                  Si no solicitaste este código, podés ignorar este mensaje con seguridad.
                                </p>
                                <p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:#475569;">
                                  <strong style="color:#0f2543;">No compartas este código</strong> con nadie, ni siquiera con personas que digan representar a MonArgent.
                                </p>
                                <p style="margin:0;font-size:13px;line-height:1.55;color:#475569;">
                                  <strong style="color:#0f2543;">MonArgent nunca te pedirá tu contraseña por email.</strong>
                                </p>
                              </td>
                            </tr>
                          </table>
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
            """.formatted(heading, intro, safeCode, expiryText);
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
