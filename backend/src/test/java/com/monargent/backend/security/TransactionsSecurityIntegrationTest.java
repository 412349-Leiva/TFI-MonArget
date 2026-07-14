package com.monargent.backend.security;

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
class TransactionsSecurityIntegrationTest {

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
    void getTransactions_withoutToken_returns401() {
        String baseUrl = ApiTestSupport.baseUrl(port);

        ResponseEntity<String> response = restTemplate.getForEntity(baseUrl + "/transactions", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void getTransactions_withValidJwt_returns200() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String email = ApiTestSupport.uniqueEmail("sec-ok");
        String password = "Password1!";
        ApiTestSupport.ensureUser(userRepository, passwordEncoder, email, password, "Sec", "Ok");
        String token = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, email, password);

        ResponseEntity<String> response = restTemplate.exchange(
            baseUrl + "/transactions",
            HttpMethod.GET,
            new HttpEntity<>(ApiTestSupport.authHeaders(token)),
            String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(response.getBody()).isArray()).isTrue();
    }

    @Test
    void getTransactions_withTamperedJwt_returns401Json() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String email = ApiTestSupport.uniqueEmail("sec-bad");
        String password = "Password1!";
        ApiTestSupport.ensureUser(userRepository, passwordEncoder, email, password, "Sec", "Bad");
        String token = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, email, password);
        String tampered = token.substring(0, token.length() - 4) + "xxxx";

        ResponseEntity<String> response = restTemplate.exchange(
            baseUrl + "/transactions",
            HttpMethod.GET,
            new HttpEntity<>(ApiTestSupport.authHeaders(tampered)),
            String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.get("status").asInt()).isEqualTo(401);
        assertThat(body.get("error").asText()).isEqualTo("No autorizado");
        assertThat(body.get("message").asText()).contains("Token de sesión inválido");
    }

    @Test
    void getTransaction_ofAnotherUser_returns404() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String password = "Password1!";

        String emailA = ApiTestSupport.uniqueEmail("sec-a");
        String emailB = ApiTestSupport.uniqueEmail("sec-b");
        ApiTestSupport.ensureUser(userRepository, passwordEncoder, emailA, password, "User", "A");
        ApiTestSupport.ensureUser(userRepository, passwordEncoder, emailB, password, "User", "B");
        String tokenA = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, emailA, password);
        String tokenB = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, emailB, password);

        ResponseEntity<String> categoryB = restTemplate.postForEntity(
            baseUrl + "/categories",
            new HttpEntity<>(
                """
                {
                  "name":"Privada B %s",
                  "type":"EXPENSE",
                  "icon":"lock",
                  "color":"#111111"
                }
                """.formatted(System.nanoTime()),
                ApiTestSupport.authHeaders(tokenB)
            ),
            String.class
        );
        long categoryId = objectMapper.readTree(categoryB.getBody()).get("id").asLong();

        ResponseEntity<String> txB = restTemplate.postForEntity(
            baseUrl + "/transactions",
            new HttpEntity<>(
                """
                {
                  "title":"Gasto privado B",
                  "amount":42,
                  "date":"%s",
                  "type":"EXPENSE",
                  "categoryId":%d
                }
                """.formatted(LocalDateTime.now(), categoryId),
                ApiTestSupport.authHeaders(tokenB)
            ),
            String.class
        );
        long txId = objectMapper.readTree(txB.getBody()).get("id").asLong();

        ResponseEntity<String> leakAttempt = restTemplate.exchange(
            baseUrl + "/transactions/" + txId,
            HttpMethod.GET,
            new HttpEntity<>(ApiTestSupport.authHeaders(tokenA)),
            String.class
        );

        assertThat(leakAttempt.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        JsonNode body = objectMapper.readTree(leakAttempt.getBody());
        assertThat(body.get("message").asText()).contains("Movimiento no encontrado");
        assertThat(leakAttempt.getBody()).doesNotContain("Gasto privado B");
    }
}
