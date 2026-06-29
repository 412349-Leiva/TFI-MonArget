package com.monargent.backend.repository;

import com.monargent.backend.entity.CalendarEvent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findAllByUserIdAndActiveTrue(Long userId);

    List<CalendarEvent> findByActiveTrue();

    Optional<CalendarEvent> findByIdAndUserId(Long id, Long userId);
}
