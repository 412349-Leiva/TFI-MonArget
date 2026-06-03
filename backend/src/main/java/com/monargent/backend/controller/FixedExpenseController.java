package com.monargent.backend.controller;

import com.monargent.backend.dto.fixedexpense.FixedExpenseCreateRequest;
import com.monargent.backend.dto.fixedexpense.FixedExpenseResponse;
import com.monargent.backend.dto.fixedexpense.FixedExpenseUpdateRequest;
import com.monargent.backend.service.FixedExpenseService;
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
@RequestMapping("/api/v1/fixed-expenses")
@RequiredArgsConstructor
public class FixedExpenseController {

    private final FixedExpenseService fixedExpenseService;

    @GetMapping
    public ResponseEntity<List<FixedExpenseResponse>> findAll() {
        return ResponseEntity.ok(fixedExpenseService.findAll());
    }

    @PostMapping
    public ResponseEntity<FixedExpenseResponse> create(@Valid @RequestBody FixedExpenseCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fixedExpenseService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FixedExpenseResponse> update(@PathVariable Long id, @Valid @RequestBody FixedExpenseUpdateRequest request) {
        return ResponseEntity.ok(fixedExpenseService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        fixedExpenseService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Fixed expense deleted successfully"));
    }
}