package com.monargent.backend.service;

import java.math.BigDecimal;
import java.util.Optional;

public interface MercadoPagoPaymentLinkService {

    /**
     * Crea un link de Checkout Pro si hay access token del cobrador configurado.
     * El cobrador debe ser quien recibe el dinero (token de su cuenta MP Developers).
     */
    Optional<String> createPaymentLink(
        String collectorAccessToken,
        BigDecimal amount,
        String title,
        String payerEmail,
        String externalReference
    );

    String buildGuestPayPageUrl(String creditorAlias, String creditorNick, BigDecimal amount, String groupTitle);
}
