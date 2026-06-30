package com.monargent.backend.dto.calendarevent;

import com.monargent.backend.enums.CalendarEventType;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventResponse {

    private Long id;
    private String title;
    private String description;
    private Integer month;
    private Integer day;
    private Integer eventHour;
    private CalendarEventType eventType;
    private boolean active;
    private LocalDateTime createdAt;
}
