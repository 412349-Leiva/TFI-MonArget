package com.monargent.backend.repository;

import com.monargent.backend.entity.GroupInvitation;
import com.monargent.backend.enums.GroupInvitationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, Long> {

    List<GroupInvitation> findByInvitedEmailIgnoreCaseAndStatus(String email, GroupInvitationStatus status);

    Optional<GroupInvitation> findByIdAndInvitedEmailIgnoreCase(Long id, String email);

    boolean existsByGroupIdAndInvitedEmailIgnoreCaseAndStatus(Long groupId, String email, GroupInvitationStatus status);
}
