package com.monargent.backend.service;

import org.springframework.web.multipart.MultipartFile;

public interface OCRSpaceService {
    String extractRawText(MultipartFile file);
}