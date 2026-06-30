package com.monargent.backend.dto.profile;

import com.monargent.backend.enums.FinancialMoodLevel;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialMoodItemResponse {

    private FinancialMoodLevel level;
    private List<String> messages;
}
