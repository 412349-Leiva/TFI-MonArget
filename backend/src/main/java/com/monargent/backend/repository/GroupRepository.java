package com.monargent.backend.repository;

import com.monargent.backend.entity.Group;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroupRepository extends JpaRepository<Group, Long> {

    @Query("""
        SELECT DISTINCT g FROM Group g
        JOIN g.members m
        WHERE m.id = :userId
        ORDER BY g.createdAt DESC
        """)
    List<Group> findAllByMemberId(@Param("userId") Long userId);

    boolean existsByIdAndMembers_Id(Long id, Long membersId);

    @Query("""
        SELECT DISTINCT g FROM Group g
        LEFT JOIN FETCH g.members
        WHERE g.id = :groupId
        """)
    Optional<Group> findByIdWithMembers(@Param("groupId") Long groupId);
}
