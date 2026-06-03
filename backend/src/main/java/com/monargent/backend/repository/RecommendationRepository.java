package com.monargent.backend.repository;

import com.monargent.backend.entity.Recommendation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteAllByUserId(Long userId);
}
