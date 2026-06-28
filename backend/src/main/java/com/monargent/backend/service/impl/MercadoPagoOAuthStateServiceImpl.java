package com.monargent.backend.service.impl;

import com.monargent.backend.exception.InvalidRequestException;
import com.monargent.backend.service.MercadoPagoOAuthStateService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MercadoPagoOAuthStateServiceImpl implements MercadoPagoOAuthStateService {

    private static final String PURPOSE = "mp_oauth";
    private static final long EXPIRATION_MS = 10 * 60 * 1000L;

    @Value("${jwt.secret}")
    private String secretKey;

    @Override
    public String generateState(Long userId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .claim("purpose", PURPOSE)
            .subject(String.valueOf(userId))
            .issuedAt(new Date(now))
            .expiration(new Date(now + EXPIRATION_MS))
            .signWith(getSigningKey())
            .compact();
    }

    @Override
    public Long validateAndExtractUserId(String state) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(state)
                .getPayload();

            if (!PURPOSE.equals(claims.get("purpose"))) {
                throw new InvalidRequestException("Estado OAuth inválido.");
            }

            return Long.parseLong(claims.getSubject());
        } catch (InvalidRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InvalidRequestException("Estado OAuth inválido o expirado.");
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
