package com.monargent.backend.service;

import com.monargent.backend.enums.AuthEmailType;

public interface AuthEmailService {

    void sendAuthCodeEmail(String toEmail, String code, AuthEmailType type, int expirationMinutes);
}
