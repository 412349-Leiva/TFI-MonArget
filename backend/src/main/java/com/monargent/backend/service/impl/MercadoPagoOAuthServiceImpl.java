package com.monargent.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.dto.mercadopago.MercadoPagoOAuthStatusResponse;
import com.monargent.backend.entity.User;
import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.MercadoPagoOAuthService;
import com.monargent.backend.service.MercadoPagoOAuthStateService;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoOAuthServiceImpl implements MercadoPagoOAuthService {

    private static final String AUTHORIZE_URL = "https://auth.mercadopago.com.ar/authorization";
    private static final String TOKEN_URL = "https://api.mercadopago.com/oauth/token";
    private static final String USERS_URL = "https://api.mercadopago.com/users/me";

    private final MercadoPagoOAuthStateService oauthStateService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${mercadopago.client-id:}")
    private String clientId;

    @Value("${mercadopago.client-secret:}")
    private String clientSecret;

    @Value("${mercadopago.redirect-uri:}")
    private String redirectUri;

    @Override
    public String buildAuthorizationUrl(Long userId) {
        ensureConfigured();
        String state = oauthStateService.generateState(userId);
        return AUTHORIZE_URL
            + "?response_type=code"
            + "&client_id=" + encode(clientId)
            + "&platform_id=mp"
            + "&redirect_uri=" + encode(redirectUri)
            + "&state=" + encode(state);
    }

    @Override
    @Transactional
    public void handleAuthorizationCallback(String code, String state) {
        ensureConfigured();

        if (code == null || code.isBlank()) {
            throw new InvalidRequestException("Mercado Pago no devolvió un código de autorización.");
        }

        Long userId = oauthStateService.validateAndExtractUserId(state);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new InvalidRequestException("Usuario no encontrado para OAuth."));

        JsonNode tokenResponse = exchangeAuthorizationCode(code);
        persistTokenResponse(user, tokenResponse);
        enrichUserFromMercadoPago(user);

        userRepository.save(user);
        log.info("Mercado Pago conectado para usuario {}", user.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public MercadoPagoOAuthStatusResponse getStatus(User user) {
        return MercadoPagoOAuthStatusResponse.builder()
            .connected(user.getMpAccessToken() != null && !user.getMpAccessToken().isBlank())
            .mpUserId(user.getMpUserId())
            .build();
    }

    @Override
    @Transactional
    public void disconnect(User user) {
        user.setMpAccessToken(null);
        user.setMpRefreshToken(null);
        user.setMpTokenExpiresAt(null);
        user.setMpUserId(null);
        user.setMpConnectedAt(null);
        userRepository.save(user);
    }

    private void ensureConfigured() {
        if (clientId == null || clientId.isBlank()
            || clientSecret == null || clientSecret.isBlank()
            || redirectUri == null || redirectUri.isBlank()) {
            throw new InvalidRequestException(
                "Mercado Pago OAuth no está configurado. Definí MERCADOPAGO_CLIENT_ID, MERCADOPAGO_CLIENT_SECRET y MERCADOPAGO_REDIRECT_URI."
            );
        }
    }

    private JsonNode exchangeAuthorizationCode(String code) {
        Map<String, Object> body = new HashMap<>();
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("grant_type", "authorization_code");
        body.put("code", code);
        body.put("redirect_uri", redirectUri);

        return postTokenRequest(body);
    }

    JsonNode refreshAccessToken(String refreshToken) {
        Map<String, Object> body = new HashMap<>();
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("grant_type", "refresh_token");
        body.put("refresh_token", refreshToken);

        return postTokenRequest(body);
    }

    private JsonNode postTokenRequest(Map<String, Object> body) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            body.forEach((key, value) -> form.add(key, String.valueOf(value)));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<String> response = restTemplate.postForEntity(
                TOKEN_URL,
                new HttpEntity<>(form, headers),
                String.class
            );

            return objectMapper.readTree(response.getBody());
        } catch (Exception ex) {
            log.warn("Error al obtener token de Mercado Pago: {}", ex.getMessage());
            throw new InvalidRequestException("No se pudo conectar con Mercado Pago. Intentá de nuevo.");
        }
    }

    public void persistTokenResponse(User user, JsonNode tokenResponse) {
        String accessToken = tokenResponse.path("access_token").asText(null);
        if (accessToken == null || accessToken.isBlank()) {
            throw new InvalidRequestException("Mercado Pago no devolvió un access token.");
        }

        user.setMpAccessToken(accessToken);

        String refreshToken = tokenResponse.path("refresh_token").asText(null);
        if (refreshToken != null && !refreshToken.isBlank()) {
            user.setMpRefreshToken(refreshToken);
        }

        long expiresIn = tokenResponse.path("expires_in").asLong(0);
        if (expiresIn > 0) {
            user.setMpTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
        }

        if (tokenResponse.hasNonNull("user_id")) {
            user.setMpUserId(tokenResponse.path("user_id").asLong());
        }

        user.setMpConnectedAt(LocalDateTime.now());
    }

    private void enrichUserFromMercadoPago(User user) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(user.getMpAccessToken());

            ResponseEntity<String> response = restTemplate.exchange(
                USERS_URL,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class
            );

            JsonNode profile = objectMapper.readTree(response.getBody());
            String nickname = profile.path("nickname").asText(null);
            if ((user.getMpAlias() == null || user.getMpAlias().isBlank())
                && nickname != null && !nickname.isBlank()) {
                user.setMpAlias(nickname);
            }
        } catch (Exception ex) {
            log.debug("No se pudo obtener perfil MP del usuario: {}", ex.getMessage());
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
