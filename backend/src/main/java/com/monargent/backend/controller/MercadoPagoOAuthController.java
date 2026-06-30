package com.monargent.backend.controller;

import com.monargent.backend.dto.mercadopago.MercadoPagoConnectResponse;
import com.monargent.backend.dto.mercadopago.MercadoPagoOAuthStatusResponse;
import com.monargent.backend.entity.User;
import com.monargent.backend.service.CurrentUserService;
import com.monargent.backend.service.MercadoPagoOAuthService;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/mercadopago/oauth")
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoOAuthController {

    private static final String CANONICAL_FRONTEND = "https://frontend-beta-ten-40.vercel.app";

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

    @GetMapping(value = "/callback", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> callback(
        @RequestParam(required = false) String code,
        @RequestParam(required = false) String state,
        @RequestParam(required = false) String error
    ) {
        String status;
        String message = null;

        if (error != null && !error.isBlank()) {
            status = "error";
            message = "Conexión cancelada en Mercado Pago.";
        } else {
            try {
                mercadoPagoOAuthService.handleAuthorizationCallback(code, state);
                status = "connected";
            } catch (Exception ex) {
                status = "error";
                message = ex.getMessage();
            }
        }

        String target = buildFrontendReturnUrl(status, message);
        log.info("Mercado Pago OAuth callback → redirect a {}", target);

        String html = """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <meta http-equiv="Cache-Control" content="no-store">
              <title>MonArgent</title>
              <style>
                body { font-family: system-ui, sans-serif; background: #0b1326; color: #e2e8f0;
                  display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
              </style>
            </head>
            <body>
              <p>Volviendo a MonArgent...</p>
              <script>window.location.replace(%s);</script>
            </body>
            </html>
            """.formatted(quoteJsString(target));

        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate")
            .contentType(MediaType.TEXT_HTML)
            .body(html);
    }

    private String buildFrontendReturnUrl(String status, String message) {
        StringBuilder url = new StringBuilder(resolveFrontendUrl())
            .append("/mp-return?mp=")
            .append(encode(status))
            .append("&mpTs=")
            .append(System.currentTimeMillis());

        if (message != null && !message.isBlank()) {
            url.append("&mpMessage=").append(encode(message));
        }

        return url.toString();
    }

    private String resolveFrontendUrl() {
        if (frontendUrl == null || frontendUrl.isBlank()) {
            return CANONICAL_FRONTEND;
        }
        String normalized = frontendUrl.trim().replaceAll("/$", "");
        if (normalized.contains("mon-argent.vercel.app")
            || normalized.contains("monargent-taupe")
            || normalized.contains("ngrok")) {
            log.warn("APP_FRONTEND_URL inválida ({}), usando {}", normalized, CANONICAL_FRONTEND);
            return CANONICAL_FRONTEND;
        }
        return normalized;
    }

    private String quoteJsString(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
