package com.monargent.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.support.ApiTestSupport;
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
class GroupSettlementFlowIntegrationTest {

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
    void confirmMovements_entersSettlementWithTransfers() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String email = ApiTestSupport.uniqueEmail("group-settle");
        String password = "Password1!";
        ApiTestSupport.ensureUser(userRepository, passwordEncoder, email, password, "Group", "Owner");
        String token = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, email, password);

        ResponseEntity<String> createGroup = restTemplate.postForEntity(
            baseUrl + "/groups",
            new HttpEntity<>(
                "{\"title\":\"Asado IT\",\"description\":\"integration\"}",
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        assertThat(createGroup.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode group = objectMapper.readTree(createGroup.getBody());
        long groupId = group.get("id").asLong();

        String guestEmail = ApiTestSupport.uniqueEmail("guest-settle");
        ResponseEntity<String> addGuest = restTemplate.postForEntity(
            baseUrl + "/groups/" + groupId + "/guests",
            new HttpEntity<>(
                """
                {
                  "name":"Invitado",
                  "mpAlias":"invitado.mp",
                  "email":"%s",
                  "expenseTitle":"Bebidas",
                  "expenseAmount":100
                }
                """.formatted(guestEmail),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        assertThat(addGuest.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> confirm = restTemplate.postForEntity(
            baseUrl + "/groups/" + groupId + "/confirm-movements",
            new HttpEntity<>(ApiTestSupport.authHeaders(token)),
            String.class
        );
        assertThat(confirm.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode confirmed = objectMapper.readTree(confirm.getBody());
        assertThat(confirmed.get("lifecycleStatus").asText()).isEqualTo("SETTLEMENT");
        assertThat(confirmed.get("settlements").isArray()).isTrue();
        assertThat(confirmed.get("settlements").size()).isGreaterThan(0);

        ResponseEntity<String> detail = restTemplate.exchange(
            baseUrl + "/groups/" + groupId,
            HttpMethod.GET,
            new HttpEntity<>(ApiTestSupport.authHeaders(token)),
            String.class
        );
        assertThat(detail.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(detail.getBody()).get("lifecycleStatus").asText())
            .isEqualTo("SETTLEMENT");
    }
}
