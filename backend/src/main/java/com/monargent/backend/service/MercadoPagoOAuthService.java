package com.monargent.backend.service;

import com.monargent.backend.dto.mercadopago.MercadoPagoOAuthStatusResponse;
import com.monargent.backend.entity.User;

public interface MercadoPagoOAuthService {

    String buildAuthorizationUrl(Long userId);

    void handleAuthorizationCallback(String code, String state);

    MercadoPagoOAuthStatusResponse getStatus(User user);

    void disconnect(User user);
}
