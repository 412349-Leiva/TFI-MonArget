package com.monargent.backend.controller;

import com.monargent.backend.dto.importation.ImportConfirmRequest;
import com.monargent.backend.dto.importation.ImportPreviewResponse;
import com.monargent.backend.dto.importation.ImportSummaryResponse;
import com.monargent.backend.service.ImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/imports")
@RequiredArgsConstructor
public class ImportController {

    private final ImportService importService;

    @PostMapping("/extract")
    public ResponseEntity<ImportPreviewResponse> extract(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(importService.extract(file));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ImportSummaryResponse> confirm(@Valid @RequestBody ImportConfirmRequest request) {
        return ResponseEntity.ok(importService.confirm(request));
    }
}
