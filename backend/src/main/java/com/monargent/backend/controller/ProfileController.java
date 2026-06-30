package com.monargent.backend.controller;

import com.monargent.backend.dto.profile.FinancialMoodResponse;
import com.monargent.backend.service.FinancialMoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final FinancialMoodService financialMoodService;

    @GetMapping("/mood")
    public ResponseEntity<FinancialMoodResponse> getMood() {
        return ResponseEntity.ok(financialMoodService.getCurrentMonthMood());
    }
}
