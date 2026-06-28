package com.monargent.backend.controller;

import com.monargent.backend.dto.mercadopago.MercadoPagoConnectResponse;
import com.monargent.backend.dto.mercadopago.MercadoPagoOAuthStatusResponse;
import com.monargent.backend.entity.User;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.MercadoPagoOAuthService;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/mercadopago/oauth")
@RequiredArgsConstructor
public class MercadoPagoOAuthController {

    private final MercadoPagoOAuthService mercadoPagoOAuthService;
    private final CurrentUserService currentUserService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/connect")
    public ResponseEntity<MercadoPagoConnectResponse> connect() {
        Long userId = currentUserService.getCurrentUserId();
        String authorizationUrl = mercadoPagoOAuthService.buildAuthorizationUrl(userId);
        return ResponseEntity.ok(MercadoPagoConnectResponse.builder()
            .authorizationUrl(authorizationUrl)
            .build());
    }

    @GetMapping("/status")
    public ResponseEntity<MercadoPagoOAuthStatusResponse> status() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(mercadoPagoOAuthService.getStatus(user));
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<Void> disconnect() {
        mercadoPagoOAuthService.disconnect(currentUserService.getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/callback")
    public RedirectView callback(
        @RequestParam(required = false) String code,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String error
    ) throws IOException {
        if (error != null && !error.isBlank()) {
            return redirectToFrontend("error", "Conexión cancelada en Mercado Pago.");
        }

        try {
            mercadoPagoOAuthService.handleAuthorizationCallback(code, state);
            return redirectToFrontend("connected", null);
        } catch (Exception ex) {
            return redirectToFrontend("error", ex.getMessage());
        }
    }

    private RedirectView redirectToFrontend(String status, String message) {
        StringBuilder url = new StringBuilder(frontendUrl)
            .append("/groups?mp=")
            .append(encode(status));

        if (message != null && !message.isBlank()) {
            url.append("&mpMessage=").append(encode(message));
        }

        return new RedirectView(url.toString());
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
