package com.monargent.backend.controller;

import com.monargent.backend.service.GroupService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/groups")
public class PublicGroupController {

    private final GroupService groupService;

    public PublicGroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping("/guest-settlements/confirm")
    public ResponseEntity<Map<String, String>> confirmGuestSettlement(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Falta el token de confirmación."));
        }
        groupService.confirmGuestSettlement(token.trim());
        return ResponseEntity.ok(Map.of("message", "Pago confirmado correctamente."));
    }
}
