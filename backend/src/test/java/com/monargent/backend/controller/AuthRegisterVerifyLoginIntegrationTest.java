package com.monargent.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.enums.VerificationPurpose;
import com.monargent.backend.repository.VerificationCodeRepository;
import com.monargent.backend.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthRegisterVerifyLoginIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VerificationCodeRepository verificationCodeRepository;

    @Test
    void registerVerifyLogin_returnsJwt() throws Exception {
        String baseUrl = ApiTestSupport.baseUrl(port);
        String email = ApiTestSupport.uniqueEmail("auth-flow");
        String password = "Password1!";

        ResponseEntity<String> register = restTemplate.postForEntity(
            baseUrl + "/auth/register",
            new HttpEntity<>(
                "{\"name\":\"Test User\",\"email\":\"" + email + "\"}",
                ApiTestSupport.jsonHeaders()
            ),
            String.class
        );
        assertThat(register.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        String code = verificationCodeRepository
            .findFirstByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(email, VerificationPurpose.REGISTRATION)
            .orElseThrow()
            .getCode();

        ResponseEntity<String> verify = restTemplate.postForEntity(
            baseUrl + "/auth/verify",
            new HttpEntity<>(
                """
                {
                  "email":"%s",
                  "code":"%s",
                  "password":"%s",
                  "passwordConfirm":"%s"
                }
                """.formatted(email, code, password, password),
                ApiTestSupport.jsonHeaders()
            ),
            String.class
        );
        assertThat(verify.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<String> login = restTemplate.postForEntity(
            baseUrl + "/auth/login",
            new HttpEntity<>(
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}",
                ApiTestSupport.jsonHeaders()
            ),
            String.class
        );
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(login.getBody());
        assertThat(body.get("token").asText()).isNotBlank();
        assertThat(body.get("verified").asBoolean()).isTrue();
    }
}
