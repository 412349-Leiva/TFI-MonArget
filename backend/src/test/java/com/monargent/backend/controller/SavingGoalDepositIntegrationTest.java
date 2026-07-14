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
class SavingGoalDepositIntegrationTest {

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
    void deposit_reachesTarget_marksCompleted() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String email = ApiTestSupport.uniqueEmail("saving-goal");
        String password = "Password1!";
        ApiTestSupport.ensureUser(userRepository, passwordEncoder, email, password, "Goal", "User");
        String token = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, email, password);

        ResponseEntity<String> incomeCategory = restTemplate.postForEntity(
            baseUrl + "/categories",
            new HttpEntity<>(
                """
                {
                  "name":"Sueldo %s",
                  "type":"INCOME",
                  "icon":"cash",
                  "color":"#00aa00"
                }
                """.formatted(System.nanoTime()),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        long incomeCategoryId = objectMapper.readTree(incomeCategory.getBody()).get("id").asLong();

        ResponseEntity<String> incomeTx = restTemplate.postForEntity(
            baseUrl + "/transactions",
            new HttpEntity<>(
                """
                {
                  "title":"Sueldo",
                  "amount":5000,
                  "date":"%s",
                  "type":"INCOME",
                  "categoryId":%d
                }
                """.formatted(LocalDateTime.now(), incomeCategoryId),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        assertThat(incomeTx.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> goalCreate = restTemplate.postForEntity(
            baseUrl + "/saving-goals",
            new HttpEntity<>(
                """
                {
                  "title":"Meta IT %s",
                  "targetAmount":100,
                  "status":"ACTIVE",
                  "iconKey":"plane"
                }
                """.formatted(System.nanoTime()),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        assertThat(goalCreate.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        long goalId = objectMapper.readTree(goalCreate.getBody()).get("id").asLong();

        ResponseEntity<String> deposit = restTemplate.exchange(
            baseUrl + "/saving-goals/" + goalId + "/deposit",
            HttpMethod.PATCH,
            new HttpEntity<>("{\"amount\":100}", ApiTestSupport.authHeaders(token)),
            String.class
        );
        assertThat(deposit.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(deposit.getBody());
        assertThat(body.get("status").asText()).isEqualTo("COMPLETED");
        assertThat(body.get("currentAmount").decimalValue()).isEqualByComparingTo("100");
    }
}
