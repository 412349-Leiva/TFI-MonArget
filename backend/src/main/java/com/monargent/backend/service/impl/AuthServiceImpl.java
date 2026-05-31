package com.monargent.backend.service.impl;

import com.monargent.backend.dto.auth.AuthResponse;
import com.monargent.backend.dto.auth.LoginRequest;
import com.monargent.backend.dto.auth.RegisterRequest;
import com.monargent.backend.dto.auth.ResendCodeRequest;
import com.monargent.backend.dto.auth.VerifyCodeRequest;
import com.monargent.backend.entity.User;
import com.monargent.backend.entity.VerificationCode;
import com.monargent.backend.exception.DuplicateEmailException;
import com.monargent.backend.exception.InvalidCredentialsException;
import com.monargent.backend.exception.InvalidVerificationCodeException;
import com.monargent.backend.exception.UserNotVerifiedException;
import com.monargent.backend.exception.VerificationCodeExpiredException;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.repository.VerificationCodeRepository;
import com.monargent.backend.service.AuthService;
import com.monargent.backend.service.JwtService;
import com.monargent.backend.utils.VerificationCodeUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JavaMailSender mailSender;
    private final VerificationCodeRepository verificationCodeRepository;

    @Value("${auth.verification.expiration-minutes:10}")
    private int verificationExpirationMinutes;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateEmailException("Email is already registered");
        }

        String code = VerificationCodeUtils.generateVerificationCode();
        sendVerificationEmail(email, code);

        VerificationCode verificationCode = VerificationCode.builder()
                .email(email)
                .code(code)
                .verified(false)
                .createdAt(LocalDateTime.now())
                .expiration(LocalDateTime.now().plusMinutes(verificationExpirationMinutes))
                .build();
        verificationCodeRepository.save(verificationCode);

        User user = User.builder()
                .name(request.getName().trim())
                .lastname(request.getLastname().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .verified(false)
                .build();

        userRepository.save(user);
        log.info("User registered: {}", user.getEmail());

        return AuthResponse.builder()
                .email(user.getEmail())
                .verified(false)
                .message("Registration initiated. Verification code sent to email.")
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!user.isVerified()) {
            throw new UserNotVerifiedException("User is not verified. Please verify your email first.");
        }

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .email(user.getEmail())
                .verified(true)
                .token(token)
                .message("Login successful")
                .build();
    }

    @Override
    public void verify(VerifyCodeRequest request) {
        String email = normalizeEmail(request.getEmail());

        VerificationCode v = verificationCodeRepository.findFirstByEmailIgnoreCaseAndCode(email, request.getCode())
                .orElseThrow(() -> new InvalidVerificationCodeException("Invalid verification code"));

        if (v.getExpiration() == null || v.getExpiration().isBefore(LocalDateTime.now())) {
            throw new VerificationCodeExpiredException("Verification code expired");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        user.setVerified(true);
        userRepository.save(user);

        verificationCodeRepository.delete(v);
    }

    @Override
    public void resendCode(ResendCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (user.isVerified()) {
            // Optionally handle this case, e.g., by throwing an exception or returning a specific message
            return;
        }

        String code = VerificationCodeUtils.generateVerificationCode();
        sendVerificationEmail(email, code);

        VerificationCode verificationCode = verificationCodeRepository.findFirstByEmailIgnoreCase(email)
                .orElse(new VerificationCode());

        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setVerified(false);
        verificationCode.setCreatedAt(LocalDateTime.now());
        verificationCode.setExpiration(LocalDateTime.now().plusMinutes(verificationExpirationMinutes));
        verificationCodeRepository.save(verificationCode);
    }

    private void sendVerificationEmail(String email, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("MonArgent - Código de Verificación");
        message.setText("Tu código de verificación es: " + code);
        mailSender.send(message);
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase(Locale.ROOT).trim();
    }
}