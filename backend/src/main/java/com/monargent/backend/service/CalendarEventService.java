package com.monargent.backend.service;

import com.monargent.backend.dto.calendarevent.CalendarEventCreateRequest;
import com.monargent.backend.dto.calendarevent.CalendarEventResponse;
import java.util.List;

public interface CalendarEventService {

    List<CalendarEventResponse> findAllForCurrentUser();

    CalendarEventResponse create(CalendarEventCreateRequest request);

    void delete(Long id);
}
