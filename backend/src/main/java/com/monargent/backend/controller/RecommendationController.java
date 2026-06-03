package com.monargent.backend.controller;

import com.monargent.backend.dto.recommendation.RecommendationResponse;
import com.monargent.backend.service.RecommendationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<List<RecommendationResponse>> findAll() {
        return ResponseEntity.ok(recommendationService.findAll());
    }

    @PostMapping("/generate")
    public ResponseEntity<List<RecommendationResponse>> generate() {
        return ResponseEntity.ok(recommendationService.generate());
    }
}
