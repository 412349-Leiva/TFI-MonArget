package com.monargent.backend.dto.importation;

import com.monargent.backend.enums.ImportSourceType;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportPreviewResponse {

    private String sourceFileName;
    private ImportSourceType sourceType;
    private List<ExtractedMovementDTO> movements;
}
