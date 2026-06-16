package com.monargent.backend.service;

import com.monargent.backend.dto.importation.ImportConfirmRequest;
import com.monargent.backend.dto.importation.ImportPreviewResponse;
import com.monargent.backend.dto.importation.ImportSummaryResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ImportService {

    ImportPreviewResponse extract(MultipartFile file);

    ImportSummaryResponse confirm(ImportConfirmRequest request);
}
