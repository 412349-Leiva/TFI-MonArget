package com.monargent.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.support.ApiTestSupport;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class FinancialMoodIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void getFinancialMood_withSeededData_returnsScoreAndLevel() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String email = ApiTestSupport.uniqueEmail("mood");
        String password = "Password1!";
        ApiTestSupport.ensureUser(userRepository, passwordEncoder, email, password, "Mood", "User");
        String token = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, email, password);

        ResponseEntity<String> incomeCategory = restTemplate.postForEntity(
            baseUrl + "/categories",
            new HttpEntity<>(
                """
                {
                  "name":"Ingresos mood %s",
                  "type":"INCOME",
                  "icon":"cash",
                  "color":"#22c55e"
                }
                """.formatted(System.nanoTime()),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        long incomeCategoryId = objectMapper.readTree(incomeCategory.getBody()).get("id").asLong();

        restTemplate.postForEntity(
            baseUrl + "/transactions",
            new HttpEntity<>(
                """
                {
                  "title":"Ingreso mood",
                  "amount":1200,
                  "date":"%s",
                  "type":"INCOME",
                  "categoryId":%d
                }
                """.formatted(LocalDateTime.now(), incomeCategoryId),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );

        ResponseEntity<String> mood = restTemplate.exchange(
            baseUrl + "/profile/mood",
            HttpMethod.GET,
            new HttpEntity<>(ApiTestSupport.authHeaders(token)),
            String.class
        );
        assertThat(mood.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(mood.getBody());
        assertThat(body.get("score").asInt()).isBetween(0, 100);
        assertThat(body.get("level").asText()).isIn("HEALTHY", "ON_TRACK", "NEEDS_ATTENTION");
        assertThat(body.get("factors").isArray()).isTrue();
        assertThat(body.get("factors").size()).isEqualTo(4);
    }
}
