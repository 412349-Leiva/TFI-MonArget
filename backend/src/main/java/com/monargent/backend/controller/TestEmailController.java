package com.monargent.backend.controller;

import com.monargent.backend.service.EmailService;
import com.monargent.backend.utils.VerificationCodeUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Slf4j
public class TestEmailController {

    private final EmailService emailService;

    @Value("${auth.dev.return-code:false}")
    private boolean devReturnCode;

    @GetMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestParam(name = "to") String to) {
        String code = VerificationCodeUtils.generateVerificationCode();
        log.info("Sending test verification email to {}", to);
        emailService.sendVerificationEmail(to, code);

        if (devReturnCode) {
            return ResponseEntity.ok().body(java.util.Map.of("message", "Email sent (dev)", "to", to, "code", code));
        }

        return ResponseEntity.ok().body(java.util.Map.of("message", "Email sent", "to", to));
    }
}
