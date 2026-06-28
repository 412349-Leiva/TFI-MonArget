package com.monargent.backend.service;

import com.monargent.backend.entity.User;
import java.util.Optional;

public interface MercadoPagoTokenService {

    Optional<String> getValidAccessToken(User user);

    Optional<String> getValidAccessToken(Long userId);

    boolean isConnected(User user);
}
