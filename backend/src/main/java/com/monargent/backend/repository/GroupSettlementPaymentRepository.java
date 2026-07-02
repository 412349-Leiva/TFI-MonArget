package com.monargent.backend.repository;

import com.monargent.backend.entity.GroupSettlementPayment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupSettlementPaymentRepository extends JpaRepository<GroupSettlementPayment, Long> {

    List<GroupSettlementPayment> findAllByGroupId(Long groupId);

    boolean existsByGroupIdAndFromMemberKeyAndToMemberKey(
        Long groupId, String fromMemberKey, String toMemberKey
    );

    Optional<GroupSettlementPayment> findByGroupIdAndFromMemberKeyAndToMemberKey(
        Long groupId, String fromMemberKey, String toMemberKey
    );

    List<GroupSettlementPayment> findAllByToMemberKey(String toMemberKey);

    List<GroupSettlementPayment> findAllByToMemberKeyAndProofUploadedAtIsNotNullOrderByProofUploadedAtDesc(
        String toMemberKey
    );
}
