package com.monargent.backend.service.impl;

import com.monargent.backend.dto.auth.AuthResponse;
import com.monargent.backend.dto.auth.LoginRequest;
import com.monargent.backend.dto.auth.RegisterRequest;
import com.monargent.backend.dto.auth.ResendCodeRequest;
import com.monargent.backend.dto.auth.VerifyCodeRequest;
import com.monargent.backend.entity.User;
import com.monargent.backend.exception.DuplicateEmailException;
import com.monargent.backend.exception.InvalidCredentialsException;
import com.monargent.backend.exception.InvalidVerificationCodeException;
import com.monargent.backend.exception.UserNotVerifiedException;
import com.monargent.backend.exception.UserNotFoundException;
import com.monargent.backend.exception.VerificationCodeExpiredException;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.repository.VerificationCodeRepository;
import com.monargent.backend.entity.VerificationCode;
import com.monargent.backend.service.AuthService;
import com.monargent.backend.service.EmailService;
import com.monargent.backend.service.JwtService;
import com.monargent.backend.utils.VerificationCodeUtils;
import java.time.LocalDateTime;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final VerificationCodeRepository verificationCodeRepository;

    @Value("${auth.verification.expiration-minutes:10}")
    private int verificationExpirationMinutes;
    @Value("${auth.dev.return-code:true}")
    private boolean devReturnCode;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateEmailException("Email is already registered");
        }

        // Require a verified verification code before creating the real user
        VerificationCode verified = verificationCodeRepository.findFirstByEmailIgnoreCaseAndVerifiedTrue(email)
            .orElseThrow(() -> new UserNotVerifiedException("Email not verified. Complete verification before creating account."));

        if (verified.getExpiration() != null && verified.getExpiration().isBefore(LocalDateTime.now())) {
            throw new VerificationCodeExpiredException("Verification code expired");
        }

        User user = User.builder()
            .name(request.getName().trim())
            .lastname(request.getLastname().trim())
            .email(email)
            .password(passwordEncoder.encode(request.getPassword()))
            .verified(true)
            .build();

        userRepository.save(user);
        // Log created user (without password)
        log.info("User created: {}", user.getEmail());

        // remove all verification codes for this email now that user exists
        verificationCodeRepository.findByEmailIgnoreCase(email).forEach(v -> verificationCodeRepository.delete(v));

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
            .email(user.getEmail())
            .verified(true)
            .token(token)
            .message("Registration complete")
            .build();
    }

    @Override
    public AuthResponse requestRegistration(com.monargent.backend.dto.auth.RequestRegistrationRequest request) {
        String email = normalizeEmail(request.getEmail());
        // If already registered and verified, reject
        if (userRepository.existsByEmailIgnoreCase(email)) {
            User existing = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (existing != null && existing.isVerified()) {
                throw new com.monargent.backend.exception.DuplicateEmailException("Email is already registered");
            }
        }

        String code = VerificationCodeUtils.generateVerificationCode();

        VerificationCode v = VerificationCode.builder()
            .email(email)
            .code(code)
            .verified(false)
            .createdAt(LocalDateTime.now())
            .expiration(LocalDateTime.now().plusMinutes(verificationExpirationMinutes))
            .name(request.getName().trim())
            .lastname(request.getLastname().trim())
            .build();

        verificationCodeRepository.save(v);
        emailService.sendVerificationEmail(email, code);

        com.monargent.backend.dto.auth.AuthResponse.AuthResponseBuilder resp = com.monargent.backend.dto.auth.AuthResponse.builder()
            .email(email)
            .verified(false)
            .message("Verification code sent to email");

        if (devReturnCode) {
            resp.verificationCode(code);
        }

        return resp.build();
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
    public AuthResponse verify(VerifyCodeRequest request) {
        String email = normalizeEmail(request.getEmail());

        VerificationCode v = verificationCodeRepository.findFirstByEmailIgnoreCaseAndCode(email, request.getCode())
            .orElseThrow(() -> new InvalidVerificationCodeException("Invalid verification code"));

        if (v.getExpiration() == null || v.getExpiration().isBefore(LocalDateTime.now())) {
            throw new VerificationCodeExpiredException("Verification code expired");
        }

        v.setVerified(true);
        verificationCodeRepository.save(v);

        return AuthResponse.builder()
            .email(email)
            .verified(true)
            .message("Verification code validated")
            .build();
    }

    @Override
    public AuthResponse resendCode(ResendCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        // If the user is already registered and verified, return that info
        if (userRepository.existsByEmailIgnoreCase(email)) {
            User existing = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (existing != null && existing.isVerified()) {
                return AuthResponse.builder()
                    .email(existing.getEmail())
                    .verified(true)
                    .message("User already verified")
                    .build();
            }
        }

        String code = VerificationCodeUtils.generateVerificationCode();

        VerificationCode v = VerificationCode.builder()
            .email(email)
            .code(code)
            .verified(false)
            .createdAt(LocalDateTime.now())
            .expiration(LocalDateTime.now().plusMinutes(verificationExpirationMinutes))
            .build();

        verificationCodeRepository.save(v);
        emailService.sendVerificationEmail(email, code);

        AuthResponse.AuthResponseBuilder resp = AuthResponse.builder()
            .email(email)
            .verified(false)
            .message("Verification code resent");

        if (devReturnCode) {
            resp.verificationCode(code);
        }

        return resp.build();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}