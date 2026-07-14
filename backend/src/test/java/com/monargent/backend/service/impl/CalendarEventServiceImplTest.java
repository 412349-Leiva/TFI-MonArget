package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.monargent.backend.dto.calendarevent.CalendarEventCreateRequest;
import com.monargent.backend.dto.calendarevent.CalendarEventResponse;
import com.monargent.backend.entity.CalendarEvent;
import com.monargent.backend.entity.User;
import com.monargent.backend.enums.CalendarEventType;
import com.monargent.backend.exception.ResourceNotFoundException;
import com.monargent.backend.repository.CalendarEventRepository;
import com.monargent.backend.service.CurrentUserService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CalendarEventServiceImplTest {

    @Mock private CalendarEventRepository calendarEventRepository;
    @Mock private CurrentUserService currentUserService;

    @InjectMocks
    private CalendarEventServiceImpl service;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Mon").lastname("Argent")
            .email("cal@example.com").password("x").verified(true).build();
    }

    @Test
    void findAllForCurrentUser_mapsActiveEvents() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        CalendarEvent event = CalendarEvent.builder()
            .id(7L).title("Cumple").description("desc").month(7).day(15)
            .eventHour(18).eventType(CalendarEventType.BIRTHDAY).user(user).active(true)
            .createdAt(LocalDateTime.now()).build();
        when(calendarEventRepository.findAllByUserIdAndActiveTrue(1L)).thenReturn(List.of(event));

        List<CalendarEventResponse> result = service.findAllForCurrentUser();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Cumple");
        assertThat(result.get(0).getEventHour()).isEqualTo(18);
    }

    @Test
    void create_defaultsHourTo12_whenNull() {
        when(currentUserService.getCurrentUser()).thenReturn(user);
        CalendarEventCreateRequest request = CalendarEventCreateRequest.builder()
            .title("  Reunion  ").description("  notas  ").month(8).day(1)
            .eventType(CalendarEventType.EVENT).build();
        when(calendarEventRepository.save(any(CalendarEvent.class))).thenAnswer(inv -> {
            CalendarEvent e = inv.getArgument(0);
            e.setId(11L);
            e.setCreatedAt(LocalDateTime.now());
            return e;
        });

        CalendarEventResponse response = service.create(request);
        ArgumentCaptor<CalendarEvent> captor = ArgumentCaptor.forClass(CalendarEvent.class);
        verify(calendarEventRepository).save(captor.capture());
        assertThat(captor.getValue().getTitle()).isEqualTo("Reunion");
        assertThat(captor.getValue().getEventHour()).isEqualTo(12);
        assertThat(response.getId()).isEqualTo(11L);
    }

    @Test
    void create_usesProvidedHour() {
        when(currentUserService.getCurrentUser()).thenReturn(user);
        CalendarEventCreateRequest request = CalendarEventCreateRequest.builder()
            .title("Cena").month(8).day(2).eventHour(20).eventType(CalendarEventType.EVENT).build();
        when(calendarEventRepository.save(any(CalendarEvent.class))).thenAnswer(inv -> {
            CalendarEvent e = inv.getArgument(0);
            e.setId(12L);
            return e;
        });

        assertThat(service.create(request).getEventHour()).isEqualTo(20);
    }

    @Test
    void delete_success() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        CalendarEvent event = CalendarEvent.builder().id(3L).user(user).build();
        when(calendarEventRepository.findByIdAndUserId(3L, 1L)).thenReturn(Optional.of(event));
        service.delete(3L);
        verify(calendarEventRepository).delete(event);
    }

    @Test
    void delete_missing_throws() {
        when(currentUserService.getCurrentUserId()).thenReturn(1L);
        when(calendarEventRepository.findByIdAndUserId(3L, 1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.delete(3L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Evento no encontrado");
    }
}
