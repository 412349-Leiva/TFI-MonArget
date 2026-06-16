package com.monargent.backend.service;

import com.monargent.backend.dto.importation.ExtractedMovementDTO;
import java.util.List;

public interface FinancialExtractionAIService {

    List<ExtractedMovementDTO> extractMovements(String rawText);
}
