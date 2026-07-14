package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class GuestPayUrlServiceImplTest {

    private GuestPayUrlServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GuestPayUrlServiceImpl();
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:5173");
    }

    @Test
    void buildGuestPayPageUrl_encodesQueryParams() {
        String url = service.buildGuestPayPageUrl("mi.alias", "Ana Pérez", new BigDecimal("100.5"), "Asado & Café");
        assertThat(url).startsWith("http://localhost:5173/pagar?");
        assertThat(url).contains("alias=mi.alias");
        assertThat(url).contains("amount=100.50");
        assertThat(url).contains("group=Asado+%26+Caf%C3%A9");
        assertThat(url).contains("to=Ana+P%C3%A9rez");
    }

    @Test
    void buildGuestPayPageUrl_nullValues_encodeAsEmpty() {
        String url = service.buildGuestPayPageUrl(null, null, BigDecimal.ZERO, null);
        assertThat(url).contains("alias=");
        assertThat(url).contains("amount=0.00");
    }
}
