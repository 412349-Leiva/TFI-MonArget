package com.monargent.backend.repository;

import com.monargent.backend.entity.GroupGuestMember;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupGuestMemberRepository extends JpaRepository<GroupGuestMember, Long> {

    List<GroupGuestMember> findAllByGroupId(Long groupId);
}
