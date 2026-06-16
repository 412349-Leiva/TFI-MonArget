package com.monargent.backend.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

class ApiErrorResponseSerializationTest {

    @Test
    void serializesLocalDateTimeAsIsoString() throws Exception {
        ObjectMapper objectMapper = Jackson2ObjectMapperBuilder.json()
            .modules(new JavaTimeModule())
            .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .build();

        ApiErrorResponse response = ApiErrorResponse.builder()
            .timestamp(LocalDateTime.of(2026, 6, 15, 12, 30, 45))
            .status(409)
            .error("Conflict")
            .message("Category already exists for this user")
            .path("/api/v1/categories")
            .build();

        String json = objectMapper.writeValueAsString(response);

        assertThat(json).contains("\"timestamp\":\"2026-06-15T12:30:45\"");
        assertThat(json).contains("\"status\":409");
        assertThat(json).contains("\"error\":\"Conflict\"");
        assertThat(json).contains("\"message\":\"Category already exists for this user\"");
        assertThat(json).contains("\"path\":\"/api/v1/categories\"");
    }
}
