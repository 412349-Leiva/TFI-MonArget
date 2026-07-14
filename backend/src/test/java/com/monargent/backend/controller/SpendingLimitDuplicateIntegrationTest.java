package com.monargent.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.support.ApiTestSupport;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class SpendingLimitDuplicateIntegrationTest {

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
    void duplicateSpendingLimit_returns409() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String email = ApiTestSupport.uniqueEmail("limit-dup");
        String password = "Password1!";
        ApiTestSupport.ensureUser(userRepository, passwordEncoder, email, password, "Limit", "Dup");
        String token = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, email, password);

        ResponseEntity<String> categoryResponse = restTemplate.postForEntity(
            baseUrl + "/categories",
            new HttpEntity<>(
                """
                {
                  "name":"Limite Dup %s",
                  "type":"EXPENSE",
                  "icon":"tag",
                  "color":"#abcdef"
                }
                """.formatted(System.nanoTime()),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        long categoryId = objectMapper.readTree(categoryResponse.getBody()).get("id").asLong();
        int month = LocalDate.now().getMonthValue();
        int year = LocalDate.now().getYear();
        String payload = """
            {
              "amountLimit":300,
              "month":%d,
              "year":%d,
              "categoryId":%d
            }
            """.formatted(month, year, categoryId);

        ResponseEntity<String> first = restTemplate.postForEntity(
            baseUrl + "/spending-limits",
            new HttpEntity<>(payload, ApiTestSupport.authHeaders(token)),
            String.class
        );
        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> duplicate = restTemplate.postForEntity(
            baseUrl + "/spending-limits",
            new HttpEntity<>(payload, ApiTestSupport.authHeaders(token)),
            String.class
        );
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(objectMapper.readTree(duplicate.getBody()).get("message").asText())
            .contains("Ya existe un límite");
    }
}
