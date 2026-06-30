package com.monargent.backend.repository;

import com.monargent.backend.entity.GroupMovementConfirmation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupMovementConfirmationRepository extends JpaRepository<GroupMovementConfirmation, Long> {

    List<GroupMovementConfirmation> findAllByGroupId(Long groupId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
}
