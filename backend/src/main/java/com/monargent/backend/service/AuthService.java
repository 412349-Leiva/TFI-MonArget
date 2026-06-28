package com.monargent.backend.service;

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

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void verify(VerifyCodeRequest request);

    void resendCode(ResendCodeRequest request);

    AuthResponse requestPasswordReset(ForgotPasswordRequest request);

    void confirmPasswordReset(ResetPasswordRequest request);

    void changePassword(ChangePasswordRequest request);

    AuthResponse updateProfile(UpdateProfileRequest request);

    AuthResponse toAuthResponse(User user, String token, String message);
}