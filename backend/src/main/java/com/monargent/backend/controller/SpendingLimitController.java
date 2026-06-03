package com.monargent.backend.controller;

import com.monargent.backend.dto.spendinglimit.SpendingLimitCreateRequest;
import com.monargent.backend.dto.spendinglimit.SpendingLimitResponse;
import com.monargent.backend.dto.spendinglimit.SpendingLimitUpdateRequest;
import com.monargent.backend.service.SpendingLimitService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/limits")
@RequiredArgsConstructor
public class SpendingLimitController {

    private final SpendingLimitService spendingLimitService;

    @GetMapping
    public ResponseEntity<List<SpendingLimitResponse>> findAll() {
        return ResponseEntity.ok(spendingLimitService.findAll());
    }

    @PostMapping
    public ResponseEntity<SpendingLimitResponse> create(@Valid @RequestBody SpendingLimitCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(spendingLimitService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SpendingLimitResponse> update(@PathVariable Long id, @Valid @RequestBody SpendingLimitUpdateRequest request) {
        return ResponseEntity.ok(spendingLimitService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        spendingLimitService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Spending limit deleted successfully"));
    }
}