package com.monargent.backend.repository;

import com.monargent.backend.entity.Category;
import com.monargent.backend.enums.CategoryType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByUserId(Long userId);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndNameIgnoreCase(Long userId, String name);

    @Query("""
        SELECT c FROM Category c
        WHERE c.user.id = :userId
          AND LOWER(c.name) = LOWER(:name)
          AND c.type = :type
        """)
    Optional<Category> findByUserIdAndNameIgnoreCaseAndType(
        @Param("userId") Long userId,
        @Param("name") String name,
        @Param("type") CategoryType type
    );
}