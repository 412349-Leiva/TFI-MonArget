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
        String subject = "MonArgent verification code";
        String body = "Your MonArgent verification code is: " + code + "\n\nThis code expires in " + verificationExpirationMinutes + " minutes.";

        // Try SendGrid API if configured
        if (sendgridApiKey != null && !sendgridApiKey.isBlank()) {
            try {
                Email from = new Email(mailFrom);
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
            message.setFrom(mailFrom);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception exception) {
            log.warn("Could not send verification email to {}. Code: {}", to, code, exception);
        }
    }
}