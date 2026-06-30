package com.monargent.backend.service.impl;

import com.monargent.backend.dto.calendarevent.CalendarEventCreateRequest;
import com.monargent.backend.dto.calendarevent.CalendarEventResponse;
import com.monargent.backend.entity.CalendarEvent;
import com.monargent.backend.entity.User;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.repository.CalendarEventRepository;
import com.monargent.backend.service.CalendarEventService;
import com.monargent.backend.service.CurrentUserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CalendarEventServiceImpl implements CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final CurrentUserService currentUserService;

    @Override
    @Transactional(readOnly = true)
    public List<CalendarEventResponse> findAllForCurrentUser() {
        return calendarEventRepository.findAllByUserIdAndActiveTrue(currentUserService.getCurrentUserId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    public CalendarEventResponse create(CalendarEventCreateRequest request) {
        User user = currentUserService.getCurrentUser();
        CalendarEvent event = CalendarEvent.builder()
            .title(request.getTitle().trim())
            .description(request.getDescription() == null ? null : request.getDescription().trim())
            .month(request.getMonth())
            .day(request.getDay())
            .eventHour(request.getEventHour() != null ? request.getEventHour() : 12)
            .eventType(request.getEventType())
            .user(user)
            .build();
        return toResponse(calendarEventRepository.save(event));
    }

    @Override
    public void delete(Long id) {
        CalendarEvent event = calendarEventRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Evento no encontrado"));
        calendarEventRepository.delete(event);
    }

    private CalendarEventResponse toResponse(CalendarEvent event) {
        return CalendarEventResponse.builder()
            .id(event.getId())
            .title(event.getTitle())
            .description(event.getDescription())
            .month(event.getMonth())
            .day(event.getDay())
            .eventHour(event.getEventHour())
            .eventType(event.getEventType())
            .active(event.isActive())
            .createdAt(event.getCreatedAt())
            .build();
    }
}
