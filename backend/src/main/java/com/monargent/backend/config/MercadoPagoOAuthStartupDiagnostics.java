package com.monargent.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoOAuthStartupDiagnostics implements ApplicationListener<ApplicationReadyEvent> {

    @Value("${mercadopago.client-id:}")
    private String clientId;

    @Value("${mercadopago.client-secret:}")
    private String clientSecret;

    @Value("${mercadopago.redirect-uri:}")
    private String redirectUri;

    @Value("${app.frontend.url:}")
    private String frontendUrl;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        boolean ready = StringUtils.hasText(clientId)
            && StringUtils.hasText(clientSecret)
            && StringUtils.hasText(redirectUri);

        log.info("[DIAG] Mercado Pago OAuth ready: {}", ready);
        if (StringUtils.hasText(clientId)) {
            log.info("[DIAG] MERCADOPAGO_CLIENT_ID: {}...", clientId.substring(0, Math.min(6, clientId.length())));
        }
        if (StringUtils.hasText(redirectUri)) {
            log.info("[DIAG] MERCADOPAGO_REDIRECT_URI: {}", redirectUri);
            log.info(
                "[DIAG] En developers.mercadopago.com → tu app → Editar → Redirect URL debe ser EXACTAMENTE: {}",
                redirectUri
            );
        }
        if (StringUtils.hasText(frontendUrl)) {
            log.info("[DIAG] APP_FRONTEND_URL: {}", frontendUrl);
        }
    }
}
