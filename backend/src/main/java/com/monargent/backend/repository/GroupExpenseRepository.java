package com.monargent.backend.repository;

import com.monargent.backend.entity.GroupExpense;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupExpenseRepository extends JpaRepository<GroupExpense, Long> {

    List<GroupExpense> findAllByGroupId(Long groupId);
}
