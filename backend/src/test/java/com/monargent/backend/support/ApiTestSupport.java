package com.monargent.backend.support;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.entity.User;
import com.monargent.backend.repository.UserRepository;
import java.util.UUID;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

public final class ApiTestSupport {

    private ApiTestSupport() {
    }

    public static String uniqueEmail(String prefix) {
        return prefix + "+" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }

    public static HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    public static HttpHeaders authHeaders(String token) {
        HttpHeaders headers = jsonHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    public static User ensureUser(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        String email,
        String password,
        String name,
        String lastname
    ) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() ->
            userRepository.save(User.builder()
                .name(name)
                .lastname(lastname)
                .email(email)
                .password(passwordEncoder.encode(password))
                .verified(true)
                .build())
        );
    }

    public static String login(
        TestRestTemplate restTemplate,
        ObjectMapper objectMapper,
        String baseUrl,
        String email,
        String password
    ) throws Exception {
        ResponseEntity<String> loginResponse = restTemplate.postForEntity(
            baseUrl + "/auth/login",
            new HttpEntity<>(
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}",
                jsonHeaders()
            ),
            String.class
        );
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(loginResponse.getBody());
        return body.get("token").asText();
    }

    public static String baseUrl(int port) {
        return "http://localhost:" + port + "/api/v1";
    }
}
