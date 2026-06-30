package com.monargent.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CategoryDuplicateApiIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void duplicateCategory_returns409WithValidJsonBody() throws Exception {
        String baseUrl = "http://localhost:" + port + "/api/v1";

        ResponseEntity<String> loginResponse = restTemplate.postForEntity(
            baseUrl + "/auth/login",
            new HttpEntity<>("{\"email\":\"monargent@example.com\",\"password\":\"12345\"}", jsonHeaders()),
            String.class
        );
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode loginBody = objectMapper.readTree(loginResponse.getBody());
        String token = loginBody.get("token").asText();

        HttpHeaders authHeaders = jsonHeaders();
        authHeaders.setBearerAuth(token);

        String categoryPayload = """
            {
              "name": "JacksonDuplicateTest",
              "type": "EXPENSE",
              "icon": "tag",
              "color": "#ff0000"
            }
            """;

        ResponseEntity<String> firstCreate = restTemplate.postForEntity(
            baseUrl + "/categories",
            new HttpEntity<>(categoryPayload, authHeaders),
            String.class
        );
        assertThat(firstCreate.getStatusCode()).isIn(HttpStatus.CREATED, HttpStatus.CONFLICT);

        ResponseEntity<String> duplicateCreate = restTemplate.postForEntity(
            baseUrl + "/categories",
            new HttpEntity<>(categoryPayload, authHeaders),
            String.class
        );

        assertThat(duplicateCreate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        JsonNode errorBody = objectMapper.readTree(duplicateCreate.getBody());
        assertThat(errorBody.get("status").asInt()).isEqualTo(409);
        assertThat(errorBody.get("error").asText()).isEqualTo("Conflict");
        assertThat(errorBody.get("message").asText()).contains("Category already exists");
        assertThat(errorBody.get("path").asText()).isEqualTo("/api/v1/categories");
        assertThat(errorBody.get("timestamp").isTextual()).isTrue();
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
