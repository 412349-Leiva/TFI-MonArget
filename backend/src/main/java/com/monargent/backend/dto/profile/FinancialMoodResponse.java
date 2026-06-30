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
public class FinancialMoodResponse {

    /** Nivel principal (el más urgente) para compatibilidad. */
    private FinancialMoodLevel level;

    /** Todos los estados activos este mes, cada uno con sus mensajes. */
    private List<FinancialMoodItemResponse> items;

    private Integer month;
    private Integer year;
}
