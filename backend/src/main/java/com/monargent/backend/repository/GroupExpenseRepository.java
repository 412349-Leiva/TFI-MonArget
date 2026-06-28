package com.monargent.backend.repository;

import com.monargent.backend.entity.GroupExpense;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GroupExpenseRepository extends JpaRepository<GroupExpense, Long> {

    @Query("""
        SELECT e FROM GroupExpense e
        LEFT JOIN FETCH e.paidBy
        LEFT JOIN FETCH e.paidByGuest
        WHERE e.group.id = :groupId
        ORDER BY e.date DESC
        """)
    List<GroupExpense> findAllByGroupId(@Param("groupId") Long groupId);
}
