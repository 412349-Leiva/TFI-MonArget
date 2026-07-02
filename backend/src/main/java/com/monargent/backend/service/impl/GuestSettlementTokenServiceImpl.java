package com.monargent.backend.service.impl;

import com.monargent.backend.service.GuestSettlementTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GuestSettlementTokenServiceImpl implements GuestSettlementTokenService {

    private static final String PAYMENT_ID_CLAIM = "paymentId";
    private static final String TOKEN_PURPOSE = "guest-settlement-confirm";
    private static final long EXPIRATION_MS = 7L * 24 * 60 * 60 * 1000;

    @Value("${jwt.secret}")
    private String secretKey;

    @Override
    public String createConfirmToken(Long paymentId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .claim(PAYMENT_ID_CLAIM, paymentId)
            .claim("purpose", TOKEN_PURPOSE)
            .issuedAt(new Date(now))
            .expiration(new Date(now + EXPIRATION_MS))
            .signWith(getSigningKey())
            .compact();
    }

    @Override
    public Long parsePaymentId(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
            if (!TOKEN_PURPOSE.equals(claims.get("purpose"))) {
                throw new JwtException("Invalid token purpose");
            }
            Number paymentId = claims.get(PAYMENT_ID_CLAIM, Number.class);
            if (paymentId == null) {
                throw new JwtException("Missing payment id");
            }
            return paymentId.longValue();
        } catch (JwtException ex) {
            throw new IllegalArgumentException("Enlace de confirmación inválido o vencido.");
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
