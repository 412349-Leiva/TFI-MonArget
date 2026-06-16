package com.monargent.backend.dto.importation;

import com.monargent.backend.enums.ImportSourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportConfirmRequest {

    private String sourceFileName;

    @NotNull
    private ImportSourceType sourceType;

    @NotEmpty
    @Valid
    private List<ImportMovementItemRequest> movements;
}
