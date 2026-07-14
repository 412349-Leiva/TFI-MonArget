package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.monargent.backend.enums.AuthEmailType;
import com.monargent.backend.enums.VerificationPurpose;
import com.monargent.backend.exception.InvalidCredentialsException;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.exception.InvalidVerificationCodeException;
import com.monargent.backend.exception.UserNotFoundException;
import com.monargent.backend.exception.VerificationCodeExpiredException;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplExtendedTest {

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
    void register_success_sendsEmailAndSavesCode() {
        when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        when(verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            "new@example.com", VerificationPurpose.REGISTRATION)).thenReturn(List.of(
            VerificationCode.builder().email("new@example.com").code("000000").build()
        ));

        AuthResponse response = authService.register(RegisterRequest.builder()
            .name("Ana Perez").email("new@example.com").build());

        assertThat(response.getEmail()).isEqualTo("new@example.com");
        assertThat(response.isVerified()).isFalse();
        verify(verificationCodeRepository).deleteAll(any());
        verify(authEmailService).sendAuthCodeEmail(eq("new@example.com"), anyString(),
            eq(AuthEmailType.REGISTRATION), eq(10));
        ArgumentCaptor<VerificationCode> captor = ArgumentCaptor.forClass(VerificationCode.class);
        verify(verificationCodeRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Ana");
        assertThat(captor.getValue().getLastname()).isEqualTo("Perez");
    }

    @Test
    void register_blankName_throws() {
        when(userRepository.existsByEmailIgnoreCase("a@example.com")).thenReturn(false);
        assertThatThrownBy(() -> authService.register(RegisterRequest.builder()
            .name("   ").email("a@example.com").build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("El nombre es obligatorio");
    }

    @Test
    void login_success_andBadPassword() {
        User user = User.builder().id(1L).name("Ana").lastname("Ana")
            .email("ana@example.com").password("enc").verified(true).build();
        when(userRepository.findByEmailIgnoreCase("ana@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        AuthResponse ok = authService.login(LoginRequest.builder()
            .email("ana@example.com").password("Password1").build());
        assertThat(ok.getToken()).isEqualTo("jwt-token");
        assertThat(ok.getName()).isEqualTo("Ana");

        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));
        assertThatThrownBy(() -> authService.login(LoginRequest.builder()
            .email("ana@example.com").password("wrong").build()))
            .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void verify_success() {
        when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        VerificationCode code = VerificationCode.builder()
            .email("new@example.com").code("123456").name("Nueva User")
            .purpose(VerificationPurpose.REGISTRATION)
            .expiration(LocalDateTime.now().plusMinutes(5)).build();
        when(verificationCodeRepository.findFirstByEmailIgnoreCaseAndCodeAndPurpose(
            "new@example.com", "123456", VerificationPurpose.REGISTRATION))
            .thenReturn(Optional.of(code));
        when(passwordEncoder.encode("Password1")).thenReturn("enc");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            "new@example.com", VerificationPurpose.REGISTRATION)).thenReturn(List.of(code));

        authService.verify(VerifyCodeRequest.builder()
            .email("new@example.com").code("123456")
            .password("Password1").passwordConfirm("Password1").build());

        verify(groupOnboardingService).onUserRegistered(any(User.class));
        verify(verificationCodeRepository).deleteAll(any());
    }

    @Test
    void verify_expiredAndInvalid() {
        when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        when(verificationCodeRepository.findFirstByEmailIgnoreCaseAndCodeAndPurpose(
            anyString(), anyString(), eq(VerificationPurpose.REGISTRATION))).thenReturn(Optional.empty());
        assertThatThrownBy(() -> authService.verify(VerifyCodeRequest.builder()
            .email("new@example.com").code("000000").password("a").passwordConfirm("a").build()))
            .isInstanceOf(InvalidVerificationCodeException.class);

        VerificationCode expired = VerificationCode.builder()
            .email("new@example.com").code("123456")
            .expiration(LocalDateTime.now().minusMinutes(1)).build();
        when(verificationCodeRepository.findFirstByEmailIgnoreCaseAndCodeAndPurpose(
            "new@example.com", "123456", VerificationPurpose.REGISTRATION))
            .thenReturn(Optional.of(expired));
        assertThatThrownBy(() -> authService.verify(VerifyCodeRequest.builder()
            .email("new@example.com").code("123456").password("a").passwordConfirm("a").build()))
            .isInstanceOf(VerificationCodeExpiredException.class);
    }

    @Test
    void passwordResetFlow_andResend_andProfile() {
        when(userRepository.existsByEmailIgnoreCase("ana@example.com")).thenReturn(true);
        when(verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            "ana@example.com", VerificationPurpose.PASSWORD_RESET)).thenReturn(List.of());
        AuthResponse resetReq = authService.requestPasswordReset(
            ForgotPasswordRequest.builder().email("ana@example.com").build());
        assertThat(resetReq.getMessage()).contains("recuperación");
        verify(authEmailService).sendAuthCodeEmail(eq("ana@example.com"), anyString(),
            eq(AuthEmailType.PASSWORD_RESET), eq(10));

        User user = User.builder().id(1L).name("Ana").lastname("Perez")
            .email("ana@example.com").password("old").verified(true).build();
        when(userRepository.findByEmailIgnoreCase("ana@example.com")).thenReturn(Optional.of(user));
        VerificationCode code = VerificationCode.builder()
            .email("ana@example.com").code("111111")
            .purpose(VerificationPurpose.PASSWORD_RESET)
            .expiration(LocalDateTime.now().plusMinutes(5)).build();
        when(verificationCodeRepository.findFirstByEmailIgnoreCaseAndCodeAndPurpose(
            "ana@example.com", "111111", VerificationPurpose.PASSWORD_RESET))
            .thenReturn(Optional.of(code));
        when(passwordEncoder.encode("NewPass1")).thenReturn("new-enc");
        when(verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            "ana@example.com", VerificationPurpose.PASSWORD_RESET)).thenReturn(List.of(code));

        authService.confirmPasswordReset(ResetPasswordRequest.builder()
            .email("ana@example.com").code("111111")
            .password("NewPass1").passwordConfirm("NewPass1").build());
        assertThat(user.getPassword()).isEqualTo("new-enc");

        when(userRepository.existsByEmailIgnoreCase("pending@example.com")).thenReturn(false);
        VerificationCode pending = VerificationCode.builder()
            .email("pending@example.com").name("Pend").lastname("Ing").build();
        when(verificationCodeRepository.findFirstByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(
            "pending@example.com", VerificationPurpose.REGISTRATION)).thenReturn(Optional.of(pending));
        when(verificationCodeRepository.findByEmailIgnoreCaseAndPurpose(
            "pending@example.com", VerificationPurpose.REGISTRATION)).thenReturn(List.of(pending));
        authService.resendCode(ResendCodeRequest.builder().email("pending@example.com").build());
        verify(authEmailService).sendAuthCodeEmail(eq("pending@example.com"), anyString(),
            eq(AuthEmailType.REGISTRATION_RESEND), eq(10));

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(passwordEncoder.matches("NewPass1", "new-enc")).thenReturn(true);
        when(passwordEncoder.encode("Newer1")).thenReturn("newer");
        authService.changePassword(ChangePasswordRequest.builder()
            .currentPassword("NewPass1").newPassword("Newer1").passwordConfirm("Newer1").build());

        AuthResponse profile = authService.updateProfile(UpdateProfileRequest.builder()
            .name("Ana Maria Perez").mpAlias(" ana.mp ").build());
        assertThat(profile.getMessage()).isEqualTo("Perfil actualizado.");
        assertThat(user.getMpAlias()).isEqualTo("ana.mp");
    }

    @Test
    void changePassword_errors() {
        User user = User.builder().id(1L).name("A").lastname("B")
            .email("a@example.com").password("enc").verified(true).build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(passwordEncoder.matches("wrong", "enc")).thenReturn(false);
        assertThatThrownBy(() -> authService.changePassword(ChangePasswordRequest.builder()
            .currentPassword("wrong").newPassword("x").passwordConfirm("x").build()))
            .isInstanceOf(InvalidCredentialsException.class);

        when(passwordEncoder.matches("enc", "enc")).thenReturn(true);
        assertThatThrownBy(() -> authService.changePassword(ChangePasswordRequest.builder()
            .currentPassword("enc").newPassword("a").passwordConfirm("b").build()))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Las contraseñas no coinciden.");
    }

    @Test
    void requestPasswordReset_unknownUser_throws() {
        when(userRepository.existsByEmailIgnoreCase("x@example.com")).thenReturn(false);
        assertThatThrownBy(() -> authService.requestPasswordReset(
            ForgotPasswordRequest.builder().email("x@example.com").build()))
            .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void toAuthResponse_displayNameVariants() {
        User same = User.builder().name("Tami").lastname("Tami").email("t@example.com").verified(true).build();
        assertThat(authService.toAuthResponse(same, null, "ok").getName()).isEqualTo("Tami");

        User endsWith = User.builder().name("Tami Leiva").lastname("Leiva").email("t@example.com").verified(true).build();
        assertThat(authService.toAuthResponse(endsWith, null, "ok").getName()).isEqualTo("Tami Leiva");

        User lastStarts = User.builder().name("Tami").lastname("Tami Leiva").email("t@example.com").verified(true).build();
        assertThat(authService.toAuthResponse(lastStarts, null, "ok").getName()).isEqualTo("Tami Leiva");
    }
}
