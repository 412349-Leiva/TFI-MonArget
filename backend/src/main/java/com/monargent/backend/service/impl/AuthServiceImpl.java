package com.monargent.backend.service.impl;

import com.monargent.backend.dto.auth.AuthResponse;
import com.monargent.backend.dto.auth.ChangePasswordRequest;
import com.monargent.backend.dto.auth.ForgotPasswordRequest;
import com.monargent.backend.dto.auth.LoginRequest;
import com.monargent.backend.dto.auth.RegisterRequest;
import com.monargent.backend.dto.auth.ResendCodeRequest;
import com.monargent.backend.dto.auth.ResetPasswordRequest;
import com.monargent.backend.dto.auth.UpdateProfileRequest;
import com.monargent.backend.dto.auth.VerifyCodeRequest;
import com.monargent.backend.entity.User;
import com.monargent.backend.entity.VerificationCode;
import com.monargent.backend.enums.VerificationPurpose;
import com.monargent.backend.exception.DuplicateEmailException;
import com.monargent.backend.exception.InvalidCredentialsException;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.InvalidVerificationCodeException;
import com.monargent.backend.exception.UserNotFoundException;
import com.monargent.backend.exception.UserNotVerifiedException;
import com.monargent.backend.exception.VerificationCodeExpiredException;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.repository.VerificationCodeRepository;
import com.monargent.backend.service.AuthService;
import com.monargent.backend.service.CurrentUserService;
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
import java.util.List;
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
    private final CurrentUserService currentUserService;

    @Value("${auth.verification.expiration-minutes:10}")
    private int verificationExpirationMinutes;

    @Override
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String name = request.getName() == null ? "" : request.getName().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateEmailException("Email is already registered");
        }

        if (name.isBlank()) {
            throw new InvalidRequestException("Name is required");
        }

        List<VerificationCode> oldCodes = verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            email, VerificationPurpose.REGISTRATION);
        if (!oldCodes.isEmpty()) {
            verificationCodeRepository.deleteAll(oldCodes);
        }

        String code = VerificationCodeUtils.generateVerificationCode();
        sendVerificationEmail(email, code, "MonArgent - Código de Verificación", "Tu código de verificación es: ");

        VerificationCode verificationCode = VerificationCode.builder()
                .email(email)
                .code(code)
                .verified(false)
                .purpose(VerificationPurpose.REGISTRATION)
                .name(name)
                .lastname(name)
                .createdAt(LocalDateTime.now())
                .expiration(LocalDateTime.now().plusMinutes(verificationExpirationMinutes))
                .build();
        verificationCodeRepository.save(verificationCode);

        return AuthResponse.builder()
                .email(email)
                .verified(false)
            .message("Verification code sent. Complete verification to set your password and finish registration.")
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!user.isVerified()) {
            throw new UserNotVerifiedException("Account is not verified. Please complete email verification.");
        }

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);

        return toAuthResponse(user, token, "Login successful");
    }

    @Override
    public void verify(VerifyCodeRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateEmailException("Email is already registered");
        }

        VerificationCode v = verificationCodeRepository
            .findFirstByEmailIgnoreCaseAndCodeAndPurpose(email, request.getCode(), VerificationPurpose.REGISTRATION)
                .orElseThrow(() -> new InvalidVerificationCodeException("Invalid verification code"));

        if (v.getExpiration() == null || v.getExpiration().isBefore(LocalDateTime.now())) {
            throw new VerificationCodeExpiredException("Verification code expired");
        }

        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            throw new InvalidRequestException("Passwords do not match");
        }

        String name = (v.getName() == null || v.getName().trim().isBlank()) ? "Usuario" : v.getName().trim();
        String lastname = (v.getLastname() == null || v.getLastname().trim().isBlank()) ? name : v.getLastname().trim();

        User user = User.builder()
                .name(name)
                .lastname(lastname)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .verified(true)
                .build();

        userRepository.save(user);
        log.info("User registered and verified: {}", user.getEmail());

        List<VerificationCode> oldCodes = verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            email, VerificationPurpose.REGISTRATION);
        if (!oldCodes.isEmpty()) {
            verificationCodeRepository.deleteAll(oldCodes);
        }
    }

    @Override
    public AuthResponse requestPasswordReset(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (!userRepository.existsByEmailIgnoreCase(email)) {
            throw new UserNotFoundException("No account found for this email");
        }

        List<VerificationCode> oldCodes = verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            email, VerificationPurpose.PASSWORD_RESET);
        if (!oldCodes.isEmpty()) {
            verificationCodeRepository.deleteAll(oldCodes);
        }

        String code = VerificationCodeUtils.generateVerificationCode();
        sendPasswordResetEmail(email, code);

        VerificationCode verificationCode = VerificationCode.builder()
            .email(email)
            .code(code)
            .verified(false)
            .purpose(VerificationPurpose.PASSWORD_RESET)
            .createdAt(LocalDateTime.now())
            .expiration(LocalDateTime.now().plusMinutes(verificationExpirationMinutes))
            .build();
        verificationCodeRepository.save(verificationCode);

        return AuthResponse.builder()
            .email(email)
            .verified(true)
            .message("Password reset code sent to your email.")
            .build();
    }

    @Override
    public void confirmPasswordReset(ResetPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UserNotFoundException("No account found for this email"));

        VerificationCode verificationCode = verificationCodeRepository
            .findFirstByEmailIgnoreCaseAndCodeAndPurpose(email, request.getCode(), VerificationPurpose.PASSWORD_RESET)
            .orElseThrow(() -> new InvalidVerificationCodeException("Invalid verification code"));

        if (verificationCode.getExpiration() == null
            || verificationCode.getExpiration().isBefore(LocalDateTime.now())) {
            throw new VerificationCodeExpiredException("Verification code expired");
        }

        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            throw new InvalidRequestException("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        List<VerificationCode> oldCodes = verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            email, VerificationPurpose.PASSWORD_RESET);
        if (!oldCodes.isEmpty()) {
            verificationCodeRepository.deleteAll(oldCodes);
        }

        log.info("Password reset completed for {}", email);
    }

    @Override
    public void resendCode(ResendCodeRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateEmailException("Email is already registered");
        }

        VerificationCode pending = verificationCodeRepository
            .findFirstByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(email, VerificationPurpose.REGISTRATION)
                .orElseThrow(() -> new UserNotFoundException("No pending verification found for this email"));

        String code = VerificationCodeUtils.generateVerificationCode();
        sendVerificationEmail(email, code, "MonArgent - Código de Verificación", "Tu código de verificación es: ");

        List<VerificationCode> oldCodes = verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            email, VerificationPurpose.REGISTRATION);
        if (!oldCodes.isEmpty()) {
            verificationCodeRepository.deleteAll(oldCodes);
        }

        VerificationCode verificationCode = VerificationCode.builder()
                .email(email)
                .code(code)
                .verified(false)
                .purpose(VerificationPurpose.REGISTRATION)
                .name(pending.getName())
                .lastname(pending.getLastname())
                .createdAt(LocalDateTime.now())
                .expiration(LocalDateTime.now().plusMinutes(verificationExpirationMinutes))
                .build();
                
        verificationCodeRepository.save(verificationCode);
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        User user = currentUserService.getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("La contraseña actual no es correcta.");
        }

        if (!request.getNewPassword().equals(request.getPasswordConfirm())) {
            throw new InvalidRequestException("Las contraseñas no coinciden.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public AuthResponse updateProfile(UpdateProfileRequest request) {
        User user = currentUserService.getCurrentUser();
        user.setMpAlias(request.getMpAlias().trim());
        userRepository.save(user);
        return toAuthResponse(user, null, "Perfil actualizado.");
    }

    @Override
    public AuthResponse toAuthResponse(User user, String token, String message) {
        String displayName = user.getName();
        if (user.getLastname() != null && !user.getLastname().isBlank()) {
            displayName = displayName + " " + user.getLastname();
        }

        return AuthResponse.builder()
            .email(user.getEmail())
            .name(displayName.trim())
            .mpAlias(user.getMpAlias())
            .mpConnected(user.getMpAccessToken() != null && !user.getMpAccessToken().isBlank())
            .verified(user.isVerified())
            .token(token)
            .message(message)
            .build();
    }

    private void sendVerificationEmail(String email, String code, String subject, String bodyPrefix) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject(subject);
            message.setText(bodyPrefix + code);
            mailSender.send(message);
            log.info("Verification email sent to {}", email);
        } catch (Exception ex) {
            System.out.println("==================================================");
            System.out.println("DEV MODE - VERIFICATION CODE for " + email + " : " + code);
            System.out.println("==================================================");
        }
    }

    private void sendPasswordResetEmail(String email, String code) {
        sendVerificationEmail(
            email,
            code,
            "MonArgent - Restablecer contraseña",
            "Tu código para restablecer la contraseña es: "
        );
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase(Locale.ROOT).trim();
    }
}