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

    @Value("${auth.verification.expiration-minutes:10}")
    private int verificationExpirationMinutes;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateEmailException("Email is already registered");
        }

        String code = VerificationCodeUtils.generateVerificationCode();
        User user = User.builder()
            .name(request.getName().trim())
            .lastname(request.getLastname().trim())
            .email(email)
            .password(passwordEncoder.encode(request.getPassword()))
            .salaryDate(request.getSalaryDate())
            .verified(false)
            .verificationCode(code)
            .verificationExpiration(LocalDateTime.now().plusMinutes(verificationExpirationMinutes))
            .build();

        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), code);

        return AuthResponse.builder()
            .email(user.getEmail())
            .verified(false)
            .message("Registration successful. Check your email to verify the account.")
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
    public AuthResponse verify(VerifyCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (user.isVerified()) {
            return AuthResponse.builder()
                .email(user.getEmail())
                .verified(true)
                .message("User already verified")
                .build();
        }

        if (user.getVerificationExpiration() == null || user.getVerificationExpiration().isBefore(LocalDateTime.now())) {
            throw new VerificationCodeExpiredException("Verification code expired");
        }

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(request.getCode())) {
            throw new InvalidVerificationCodeException("Invalid verification code");
        }

        user.setVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiration(null);
        userRepository.save(user);

        return AuthResponse.builder()
            .email(user.getEmail())
            .verified(true)
            .message("Email verified successfully")
            .build();
    }

    @Override
    public AuthResponse resendCode(ResendCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (user.isVerified()) {
            return AuthResponse.builder()
                .email(user.getEmail())
                .verified(true)
                .message("User already verified")
                .build();
        }

        String code = VerificationCodeUtils.generateVerificationCode();
        user.setVerificationCode(code);
        user.setVerificationExpiration(LocalDateTime.now().plusMinutes(verificationExpirationMinutes));
        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), code);

        return AuthResponse.builder()
            .email(user.getEmail())
            .verified(false)
            .message("Verification code resent")
            .build();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}