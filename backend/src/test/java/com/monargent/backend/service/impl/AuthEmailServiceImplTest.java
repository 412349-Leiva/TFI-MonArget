package com.monargent.backend.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.enums.AuthEmailType;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthEmailServiceImplTest {

    @Mock private JavaMailSender mailSender;
    @Mock private MimeMessage mimeMessage;

    @InjectMocks
    private AuthEmailServiceImpl service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "fromAddress", "noreply@monargent.app");
    }

    @Test
    void sendAuthCodeEmail_allTypes_success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        service.sendAuthCodeEmail("a@example.com", "123456", AuthEmailType.REGISTRATION, 10);
        service.sendAuthCodeEmail("a@example.com", "123456", AuthEmailType.REGISTRATION_RESEND, 1);
        service.sendAuthCodeEmail("a@example.com", "123456", AuthEmailType.PASSWORD_RESET, 5);
        verify(mailSender, org.mockito.Mockito.times(3)).send(mimeMessage);
    }

    @Test
    void sendAuthCodeEmail_mailFailure_fallsBackToConsole() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("smtp down")).when(mailSender).send(any(MimeMessage.class));
        service.sendAuthCodeEmail("a@example.com", "999999", AuthEmailType.REGISTRATION, 10);
    }
}
