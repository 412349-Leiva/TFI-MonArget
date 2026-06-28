package com.monargent.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.monargent.backend.entity.User;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.MercadoPagoOAuthService;
import com.monargent.backend.service.MercadoPagoTokenService;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoTokenServiceImpl implements MercadoPagoTokenService {

    private static final long REFRESH_BUFFER_SECONDS = 120;

    private final UserRepository userRepository;
    private final MercadoPagoOAuthServiceImpl mercadoPagoOAuthService;

    @Override
    @Transactional
    public Optional<String> getValidAccessToken(User user) {
        return getValidAccessToken(user.getId());
    }

    @Override
    @Transactional
    public Optional<String> getValidAccessToken(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getMpAccessToken() == null || user.getMpAccessToken().isBlank()) {
            return Optional.empty();
        }

        if (shouldRefresh(user)) {
            refreshUserToken(user);
        }

        if (user.getMpAccessToken() == null || user.getMpAccessToken().isBlank()) {
            return Optional.empty();
        }

        return Optional.of(user.getMpAccessToken());
    }

    @Override
    public boolean isConnected(User user) {
        return user.getMpAccessToken() != null && !user.getMpAccessToken().isBlank();
    }

    private boolean shouldRefresh(User user) {
        if (user.getMpRefreshToken() == null || user.getMpRefreshToken().isBlank()) {
            return false;
        }
        if (user.getMpTokenExpiresAt() == null) {
            return true;
        }
        return user.getMpTokenExpiresAt().isBefore(LocalDateTime.now().plusSeconds(REFRESH_BUFFER_SECONDS));
    }

    private void refreshUserToken(User user) {
        try {
            JsonNode tokenResponse = mercadoPagoOAuthService.refreshAccessToken(user.getMpRefreshToken());
            mercadoPagoOAuthService.persistTokenResponse(user, tokenResponse);
            userRepository.save(user);
        } catch (InvalidRequestException ex) {
            log.warn("No se pudo refrescar token MP para usuario {}: {}", user.getEmail(), ex.getMessage());
            clearTokens(user);
            userRepository.save(user);
        } catch (Exception ex) {
            log.warn("Error inesperado al refrescar token MP: {}", ex.getMessage());
        }
    }

    private void clearTokens(User user) {
        user.setMpAccessToken(null);
        user.setMpRefreshToken(null);
        user.setMpTokenExpiresAt(null);
        user.setMpConnectedAt(null);
    }
}
