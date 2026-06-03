package com.monargent.backend.controller;

import com.monargent.backend.dto.financialprofile.FinancialProfileCreateRequest;
import com.monargent.backend.dto.financialprofile.FinancialProfileResponse;
import com.monargent.backend.dto.financialprofile.FinancialProfileUpdateRequest;
import com.monargent.backend.service.FinancialProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/financial-profile")
@RequiredArgsConstructor
public class FinancialProfileController {

    private final FinancialProfileService financialProfileService;

    @PostMapping
    public ResponseEntity<FinancialProfileResponse> create(@Valid @RequestBody FinancialProfileCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(financialProfileService.create(request));
    }

    @GetMapping
    public ResponseEntity<FinancialProfileResponse> getCurrentProfile() {
        return ResponseEntity.ok(financialProfileService.getCurrentProfile());
    }

    @PutMapping
    public ResponseEntity<FinancialProfileResponse> update(@Valid @RequestBody FinancialProfileUpdateRequest request) {
        return ResponseEntity.ok(financialProfileService.update(request));
    }
}