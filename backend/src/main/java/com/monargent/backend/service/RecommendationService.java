package com.monargent.backend.service;

import com.monargent.backend.dto.recommendation.RecommendationResponse;
import java.util.List;

public interface RecommendationService {

    List<RecommendationResponse> findAll();

    List<RecommendationResponse> generate();
}
