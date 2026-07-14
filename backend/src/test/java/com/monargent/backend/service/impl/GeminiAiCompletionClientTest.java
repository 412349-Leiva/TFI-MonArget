package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.monargent.backend.exception.AiServiceUnavailableException;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
class GeminiAiCompletionClientTest {

    @Mock private RestTemplate restTemplate;

    @InjectMocks
    private GeminiAiCompletionClient client;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(client, "geminiApiKey", "test-key");
        ReflectionTestUtils.setField(client, "geminiModel", "gemini-2.0-flash");
    }

    @Test
    void complete_withoutApiKey_throws() {
        ReflectionTestUtils.setField(client, "geminiApiKey", " ");
        assertThatThrownBy(() -> client.complete("sys", "user"))
            .isInstanceOf(AiServiceUnavailableException.class)
            .hasMessageContaining("GEMINI_API_KEY");
    }

    @Test
    void complete_success_extractsText() {
        Map<String, Object> body = Map.of(
            "candidates", java.util.List.of(
                Map.of("content", Map.of("parts", java.util.List.of(Map.of("text", "hola mundo"))))
            )
        );
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(),
            any(ParameterizedTypeReference.class)))
            .thenReturn(ResponseEntity.ok(body));

        assertThat(client.complete("sys", "user")).isEqualTo("hola mundo");
    }

    @Test
    void complete_httpError_throwsUnavailable() {
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(),
            any(ParameterizedTypeReference.class)))
            .thenThrow(HttpClientErrorException.create(HttpStatus.BAD_REQUEST, "bad", null, null, null));

        assertThatThrownBy(() -> client.complete("sys", "user"))
            .isInstanceOf(AiServiceUnavailableException.class);
    }
}
