package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class GuestSettlementTokenServiceImplTest {

    private static final String SECRET =
        "bW9uYXJnZW50c2VjcmV0a2V5Zm9yand0dG9rZW5tb25hcmdlbnQyMDI2";

    private GuestSettlementTokenServiceImpl tokenService;

    @BeforeEach
    void setUp() {
        tokenService = new GuestSettlementTokenServiceImpl();
        ReflectionTestUtils.setField(tokenService, "secretKey", SECRET);
    }

    @Test
    void createAndParse_paymentIdRoundtrip() {
        String token = tokenService.createConfirmToken(42L);

        assertThat(tokenService.parsePaymentId(token)).isEqualTo(42L);
    }

    @Test
    void parsePaymentId_wrongPurpose_throwsSpanishMessage() {
        long now = System.currentTimeMillis();
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET));
        String wrongPurposeToken = Jwts.builder()
            .claim("paymentId", 7L)
            .claim("purpose", "not-guest-settlement")
            .issuedAt(new Date(now))
            .expiration(new Date(now + 60_000))
            .signWith(key)
            .compact();

        assertThatThrownBy(() -> tokenService.parsePaymentId(wrongPurposeToken))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Enlace de confirmación inválido o vencido.");
    }
}
