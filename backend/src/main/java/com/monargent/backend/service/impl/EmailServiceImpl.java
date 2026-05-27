package com.monargent.backend.service.impl;

import com.monargent.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import com.monargent.backend.exception.EmailSendException;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${auth.verification.expiration-minutes:10}")
    private int verificationExpirationMinutes;
    @Value("${sendgrid.api.key:}")
    private String sendgridApiKey;

    @Value("${spring.mail.username:no-reply@monargent.local}")
    private String mailFrom;

    @Override
    public void sendVerificationEmail(String to, String code) {
        String subject = "Tu código de verificación de MonArgent";
        String body = "Tu código de verificación de MonArgent es: " + code + "\n\nExpira en " + verificationExpirationMinutes + " minutos.";

        String effectiveFrom = (mailFrom == null || mailFrom.isBlank()) ? "no-reply@monargent.local" : mailFrom;

        // Basic email validation
        if (to == null || to.isBlank() || !EMAIL_PATTERN.matcher(to).matches()) {
            log.warn("Invalid destination email address: '{}'", to);
            throw new EmailSendException("Invalid destination email address");
        }

        // Try SendGrid API if configured
        if (sendgridApiKey != null && !sendgridApiKey.isBlank()) {
            try {
                Email from = new Email(effectiveFrom);
                Email toEmail = new Email(to);
                Content content = new Content("text/plain", body);
                Mail mail = new Mail(from, subject, toEmail, content);

                SendGrid sg = new SendGrid(sendgridApiKey);
                Request request = new Request();
                request.setMethod(Method.POST);
                request.setEndpoint("mail/send");
                request.setBody(mail.build());

                Response response = sg.api(request);
                if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                    log.info("SendGrid: email sent to {} (status={})", to, response.getStatusCode());
                    return;
                } else {
                    log.warn("SendGrid returned non-2xx status: {} body: {}", response.getStatusCode(), response.getBody());
                }
            } catch (Exception ex) {
                log.warn("SendGrid send failed for {}. Code: {}", to, code, ex);
            }
        }

        // Fallback to JavaMailSender (SMTP)
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setFrom(effectiveFrom);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("SMTP: email sent to {} from {}", to, effectiveFrom);
        } catch (MailAuthenticationException authEx) {
            log.error("SMTP authentication failed for mail user='{}'. Cause: {}", mailFrom, authEx.getMessage());
            throw new EmailSendException("SMTP authentication failed", authEx);
        } catch (MailSendException sendEx) {
            log.error("SMTP send failed to {}. Cause: {}", to, sendEx.getMessage());
            throw new EmailSendException("SMTP send failed", sendEx);
        } catch (MailException mex) {
            log.error("General mail error sending to {}. Cause: {}", to, mex.getMessage());
            throw new EmailSendException("General mail error", mex);
        } catch (Exception exception) {
            log.error("Unexpected error sending email to {}. Code: {}", to, code, exception);
            throw new EmailSendException("Unexpected error sending email", exception);
        }
    }

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
}