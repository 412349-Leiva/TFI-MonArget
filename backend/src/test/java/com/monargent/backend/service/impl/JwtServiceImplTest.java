package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.monargent.backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceImplTest {

    private static final String SECRET =
        "bW9uYXJnZW50c2VjcmV0a2V5Zm9yand0dG9rZW5tb25hcmdlbnQyMDI2";

    private JwtServiceImpl jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtServiceImpl();
        ReflectionTestUtils.setField(jwtService, "secretKey", SECRET);
        ReflectionTestUtils.setField(jwtService, "expirationMs", 86_400_000L);
    }

    @Test
    void generateAndExtract_roundtripReturnsUsername() {
        User user = User.builder()
            .id(1L)
            .name("Mon")
            .lastname("Argent")
            .email("jwt-roundtrip@example.com")
            .password("encoded")
            .verified(true)
            .build();

        String token = jwtService.generateToken(user);

        assertThat(jwtService.extractUsername(token)).isEqualTo("jwt-roundtrip@example.com");
        assertThat(jwtService.isTokenValid(token, user)).isTrue();
    }

    @Test
    void isTokenValid_wrongUser_returnsFalse() {
        User owner = User.builder()
            .id(1L)
            .name("Owner")
            .lastname("User")
            .email("owner@example.com")
            .password("encoded")
            .verified(true)
            .build();
        User other = User.builder()
            .id(2L)
            .name("Other")
            .lastname("User")
            .email("other@example.com")
            .password("encoded")
            .verified(true)
            .build();

        String token = jwtService.generateToken(owner);

        assertThat(jwtService.isTokenValid(token, other)).isFalse();
    }
}
