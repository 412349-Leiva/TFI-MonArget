package com.monargent.backend.repository;

import com.monargent.backend.entity.Transaction;
import com.monargent.backend.enums.TransactionType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    List<Transaction> findAllByUserId(Long userId);

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    List<Transaction> findAllByUserIdAndType(Long userId, TransactionType type);

    List<Transaction> findAllByUserIdAndCategoryId(Long userId, Long categoryId);

    boolean existsByUserIdAndCategoryId(Long userId, Long categoryId);

    @Query("""
        select t from Transaction t
        where t.user.id = :userId
          and month(t.date) = :month
          and year(t.date) = :year
        order by t.date desc
        """)
    List<Transaction> findAllByUserIdAndMonthAndYear(@Param("userId") Long userId,
                                                     @Param("month") Integer month,
                                                     @Param("year") Integer year);

    @Query("""
        select t from Transaction t
        where t.user.id = :userId
          and month(t.date) = :month
          and year(t.date) = :year
          and t.type = :type
        order by t.date desc
        """)
    List<Transaction> findAllByUserIdAndMonthAndYearAndType(@Param("userId") Long userId,
                                                            @Param("month") Integer month,
                                                            @Param("year") Integer year,
                                                            @Param("type") TransactionType type);

    @Query("""
        select t from Transaction t
        where t.user.id = :userId
          and month(t.date) = :month
          and year(t.date) = :year
          and t.category.id = :categoryId
        order by t.date desc
        """)
    List<Transaction> findAllByUserIdAndMonthAndYearAndCategoryId(@Param("userId") Long userId,
                                                                  @Param("month") Integer month,
                                                                  @Param("year") Integer year,
                                                                  @Param("categoryId") Long categoryId);

    @Query("""
        select coalesce(sum(t.amount), 0) from Transaction t
        where t.user.id = :userId
          and month(t.date) = :month
          and year(t.date) = :year
          and t.type = :type
        """)
    java.math.BigDecimal sumAmountByUserAndMonthAndYearAndType(
        @Param("userId") Long userId,
        @Param("month") Integer month,
        @Param("year") Integer year,
        @Param("type") TransactionType type
    );

    @Query("""
        select coalesce(sum(t.amount), 0) from Transaction t
        where t.user.id = :userId
          and month(t.date) = :month
          and year(t.date) = :year
          and t.title = :title
        """)
    java.math.BigDecimal sumAmountByUserAndMonthAndYearAndTitle(
        @Param("userId") Long userId,
        @Param("month") Integer month,
        @Param("year") Integer year,
        @Param("title") String title
    );

    void deleteAllBySourceGroupId(Long sourceGroupId);

    List<Transaction> findAllBySourceGroupId(Long sourceGroupId);
}