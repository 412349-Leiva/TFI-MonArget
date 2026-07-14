package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.auth.LoginRequest;
import com.monargent.backend.dto.auth.RegisterRequest;
import com.monargent.backend.dto.auth.VerifyCodeRequest;
import com.monargent.backend.entity.User;
import com.monargent.backend.entity.VerificationCode;
import com.monargent.backend.enums.VerificationPurpose;
import com.monargent.backend.exception.DuplicateEmailException;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.UserNotVerifiedException;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.repository.VerificationCodeRepository;
import com.monargent.backend.service.AuthEmailService;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.GroupOnboardingService;
import com.monargent.backend.service.JwtService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;
    @Mock private GroupOnboardingService groupOnboardingService;
    @Mock private AuthEmailService authEmailService;
    @Mock private VerificationCodeRepository verificationCodeRepository;
    @Mock private CurrentUserService currentUserService;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "verificationExpirationMinutes", 10);
    }

    @Test
    void login_unverifiedUser_throwsSpanishMessage() {
        User user = User.builder()
            .id(1L)
            .name("Mon")
            .lastname("Argent")
            .email("unverified@example.com")
            .password("encoded")
            .verified(false)
            .build();
        when(userRepository.findByEmailIgnoreCase("unverified@example.com"))
            .thenReturn(Optional.of(user));

        LoginRequest request = LoginRequest.builder()
            .email("unverified@example.com")
            .password("Password1")
            .build();

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(UserNotVerifiedException.class)
            .hasMessage("La cuenta no está verificada. Completá la verificación por correo.");
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    void register_duplicateEmail_throwsSpanishMessage() {
        when(userRepository.existsByEmailIgnoreCase("dup@example.com")).thenReturn(true);

        RegisterRequest request = RegisterRequest.builder()
            .name("Dup User")
            .email("dup@example.com")
            .build();

        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(DuplicateEmailException.class)
            .hasMessage("El correo ya está registrado");
        verify(authEmailService, never()).sendAuthCodeEmail(anyString(), anyString(), any(), anyInt());
    }

    @Test
    void verify_passwordMismatch_throwsSpanishMessage() {
        when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        VerificationCode code = VerificationCode.builder()
            .email("new@example.com")
            .code("123456")
            .purpose(VerificationPurpose.REGISTRATION)
            .name("Nueva")
            .expiration(LocalDateTime.now().plusMinutes(5))
            .build();
        when(verificationCodeRepository.findFirstByEmailIgnoreCaseAndCodeAndPurpose(
            eq("new@example.com"), eq("123456"), eq(VerificationPurpose.REGISTRATION)))
            .thenReturn(Optional.of(code));

        VerifyCodeRequest request = VerifyCodeRequest.builder()
            .email("new@example.com")
            .code("123456")
            .password("Password1")
            .passwordConfirm("Password2")
            .build();

        assertThatThrownBy(() -> authService.verify(request))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Las contraseñas no coinciden");
        verify(userRepository, never()).save(any(User.class));
    }
}
