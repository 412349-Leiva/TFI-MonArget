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
            log.warn(
                "No se pudo enviar el correo a {} ({}). Código de desarrollo (solo local): {}",
                toEmail,
                type,
                code
            );
            System.out.println("==================================================");
            System.out.println("MonArgent — correo no enviado (modo local)");
            System.out.println("Para: " + toEmail);
            System.out.println("Código: " + code);
            System.out.println("Vence en " + expirationMinutes + " minutos");
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
        String intro = MonargentEmailTemplate.escapeHtml(resolveIntro(type));
        String bodyContent = """
            <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#475569;">%s</p>
            %s
            """.formatted(intro, MonargentEmailTemplate.buildCodeBox(code, resolveExpiryText(expirationMinutes)));

        return MonargentEmailTemplate.buildEmailWithExtraSection(
            resolveHeading(type),
            bodyContent,
            MonargentEmailTemplate.buildSecuritySection()
        );
    }
}
