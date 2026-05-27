package com.monargent.backend.service;

import com.monargent.backend.dto.auth.AuthResponse;
import com.monargent.backend.dto.auth.LoginRequest;
import com.monargent.backend.dto.auth.RegisterRequest;
import com.monargent.backend.dto.auth.ResendCodeRequest;
import com.monargent.backend.dto.auth.VerifyCodeRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse verify(VerifyCodeRequest request);

    AuthResponse resendCode(ResendCodeRequest request);
}