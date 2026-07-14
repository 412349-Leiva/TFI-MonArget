package com.monargent.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.entity.User;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.support.ApiTestSupport;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
class CategorySpendingLimitExpenseIntegrationTest {

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
    void categoryLimitAndExpense_updatesCurrentAmount() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String email = ApiTestSupport.uniqueEmail("cat-limit");
        String password = "Password1!";
        ApiTestSupport.ensureUser(userRepository, passwordEncoder, email, password, "Cat", "Limit");
        String token = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, email, password);

        ResponseEntity<String> categoryResponse = restTemplate.postForEntity(
            baseUrl + "/categories",
            new HttpEntity<>(
                """
                {
                  "name":"Comida Limit %s",
                  "type":"EXPENSE",
                  "icon":"tag",
                  "color":"#ff8800"
                }
                """.formatted(System.nanoTime()),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        assertThat(categoryResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        long categoryId = objectMapper.readTree(categoryResponse.getBody()).get("id").asLong();

        int month = LocalDate.now().getMonthValue();
        int year = LocalDate.now().getYear();
        ResponseEntity<String> limitResponse = restTemplate.postForEntity(
            baseUrl + "/spending-limits",
            new HttpEntity<>(
                """
                {
                  "amountLimit":500,
                  "month":%d,
                  "year":%d,
                  "categoryId":%d
                }
                """.formatted(month, year, categoryId),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        assertThat(limitResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(objectMapper.readTree(limitResponse.getBody()).get("currentAmount").decimalValue())
            .isEqualByComparingTo("0");

        ResponseEntity<String> expenseResponse = restTemplate.postForEntity(
            baseUrl + "/transactions",
            new HttpEntity<>(
                """
                {
                  "title":"Almuerzo",
                  "description":"IT",
                  "amount":120.50,
                  "date":"%s",
                  "type":"EXPENSE",
                  "categoryId":%d
                }
                """.formatted(LocalDateTime.now(), categoryId),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        assertThat(expenseResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> limits = restTemplate.exchange(
            baseUrl + "/spending-limits",
            org.springframework.http.HttpMethod.GET,
            new HttpEntity<>(ApiTestSupport.authHeaders(token)),
            String.class
        );
        assertThat(limits.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode limitsBody = objectMapper.readTree(limits.getBody());
        JsonNode updated = null;
        for (JsonNode node : limitsBody) {
            if (node.get("categoryId").asLong() == categoryId) {
                updated = node;
                break;
            }
        }
        assertThat(updated).isNotNull();
        assertThat(updated.get("currentAmount").decimalValue()).isEqualByComparingTo("120.50");
    }
}
