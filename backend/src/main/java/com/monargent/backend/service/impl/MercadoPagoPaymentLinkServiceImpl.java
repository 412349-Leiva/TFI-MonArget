package com.monargent.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.service.MercadoPagoPaymentLinkService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoPaymentLinkServiceImpl implements MercadoPagoPaymentLinkService {

    private static final String PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public Optional<String> createPaymentLink(
        String collectorAccessToken,
        BigDecimal amount,
        String title,
        String payerEmail,
        String externalReference
    ) {
        if (collectorAccessToken == null || collectorAccessToken.isBlank()
            || amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return Optional.empty();
        }

        try {
            Map<String, Object> item = new HashMap<>();
            item.put("title", title);
            item.put("quantity", 1);
            item.put("currency_id", "ARS");
            item.put("unit_price", amount.setScale(2, RoundingMode.HALF_UP));

            Map<String, Object> body = new HashMap<>();
            body.put("items", List.of(item));
            body.put("external_reference", externalReference);

            if (payerEmail != null && !payerEmail.isBlank()) {
                body.put("payer", Map.of("email", payerEmail));
            }

            Map<String, String> backUrls = new HashMap<>();
            backUrls.put("success", frontendUrl + "/pagar?status=ok");
            backUrls.put("failure", frontendUrl + "/pagar?status=error");
            backUrls.put("pending", frontendUrl + "/pagar?status=pending");
            body.put("back_urls", backUrls);
            body.put("auto_return", "approved");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(collectorAccessToken);

            ResponseEntity<String> response = restTemplate.postForEntity(
                PREFERENCES_URL,
                new HttpEntity<>(body, headers),
                String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String initPoint = root.path("init_point").asText(null);
            if (initPoint == null || initPoint.isBlank()) {
                initPoint = root.path("sandbox_init_point").asText(null);
            }
            return Optional.ofNullable(initPoint).filter(url -> !url.isBlank());
        } catch (Exception ex) {
            log.warn("No se pudo crear link de Mercado Pago: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public String buildGuestPayPageUrl(
        String creditorAlias,
        String creditorNick,
        BigDecimal amount,
        String groupTitle
    ) {
        return frontendUrl
            + "/pagar?alias=" + encode(creditorAlias)
            + "&to=" + encode(creditorNick)
            + "&amount=" + amount.setScale(2, RoundingMode.HALF_UP).toPlainString()
            + "&group=" + encode(groupTitle);
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
