package com.monargent.backend.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
public class PublicConfigController {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${mercadopago.redirect-uri:}")
    private String mpRedirectUri;

    @GetMapping("/runtime-config")
    public ResponseEntity<Map<String, String>> runtimeConfig() {
        return ResponseEntity.ok(Map.of(
            "frontendUrl", frontendUrl,
            "mpRedirectUri", mpRedirectUri == null ? "" : mpRedirectUri,
            "mpOAuthCallbackMustBe", "backend ngrok URL — never a Vercel domain"
        ));
    }
}
