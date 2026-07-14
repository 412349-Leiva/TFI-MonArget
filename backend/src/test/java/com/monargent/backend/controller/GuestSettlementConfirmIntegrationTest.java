package com.monargent.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.entity.GroupSettlementPayment;
import com.monargent.backend.repository.GroupSettlementPaymentRepository;
import com.monargent.backend.repository.UserRepository;
import com.monargent.backend.service.GuestSettlementTokenService;
import com.monargent.backend.support.ApiTestSupport;
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
class GuestSettlementConfirmIntegrationTest {

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

    @Autowired
    private GroupSettlementPaymentRepository settlementPaymentRepository;

    @Autowired
    private GuestSettlementTokenService guestSettlementTokenService;

    @Test
    void publicGuestSettlementConfirm_acceptsValidToken() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String email = ApiTestSupport.uniqueEmail("guest-confirm");
        String password = "Password1!";
        var user = ApiTestSupport.ensureUser(userRepository, passwordEncoder, email, password, "Guest", "Confirm");
        String token = ApiTestSupport.login(restTemplate, objectMapper, baseUrl, email, password);

        ResponseEntity<String> createGroup = restTemplate.postForEntity(
            baseUrl + "/groups",
            new HttpEntity<>(
                "{\"title\":\"Viaje guest\",\"description\":\"integration\"}",
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        long groupId = objectMapper.readTree(createGroup.getBody()).get("id").asLong();

        String guestEmail = ApiTestSupport.uniqueEmail("public-guest");
        ResponseEntity<String> addGuest = restTemplate.postForEntity(
            baseUrl + "/groups/" + groupId + "/guests",
            new HttpEntity<>(
                """
                {
                  "name":"Cobrador",
                  "mpAlias":"cobrador.mp",
                  "email":"%s",
                  "expenseTitle":"Hotel",
                  "expenseAmount":200
                }
                """.formatted(guestEmail),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        assertThat(addGuest.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode guestBody = objectMapper.readTree(addGuest.getBody());
        String guestKey = null;
        for (JsonNode member : guestBody.get("members")) {
            if (member.path("guest").asBoolean(false)) {
                guestKey = member.get("memberKey").asText();
                break;
            }
        }
        assertThat(guestKey).isNotBlank();

        restTemplate.postForEntity(
            baseUrl + "/groups/" + groupId + "/confirm-movements",
            new HttpEntity<>(ApiTestSupport.authHeaders(token)),
            String.class
        );

        String fromKey = "user-" + user.getId();
        ResponseEntity<String> markPaid = restTemplate.postForEntity(
            baseUrl + "/groups/" + groupId + "/settlements/mark-paid",
            new HttpEntity<>(
                """
                {
                  "fromMemberKey":"%s",
                  "toMemberKey":"%s"
                }
                """.formatted(fromKey, guestKey),
                ApiTestSupport.authHeaders(token)
            ),
            String.class
        );
        assertThat(markPaid.getStatusCode()).isEqualTo(HttpStatus.OK);

        GroupSettlementPayment payment = settlementPaymentRepository
            .findByGroupIdAndFromMemberKeyAndToMemberKey(groupId, fromKey, guestKey)
            .orElseThrow();
        String confirmToken = guestSettlementTokenService.createConfirmToken(payment.getId());

        ResponseEntity<String> publicConfirm = restTemplate.postForEntity(
            baseUrl + "/public/groups/guest-settlements/confirm",
            new HttpEntity<>(
                "{\"token\":\"" + confirmToken + "\"}",
                ApiTestSupport.jsonHeaders()
            ),
            String.class
        );
        assertThat(publicConfirm.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(objectMapper.readTree(publicConfirm.getBody()).get("message").asText())
            .contains("Pago confirmado");
        assertThat(settlementPaymentRepository.findById(payment.getId()).orElseThrow().isConfirmed())
            .isTrue();
    }
}
