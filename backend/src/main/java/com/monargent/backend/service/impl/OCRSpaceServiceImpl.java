package com.monargent.backend.service.impl;
import com.monargent.backend.dto.ocr.OCRSpaceResponse;
import com.monargent.backend.service.OCRSpaceService;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
@Service
@RequiredArgsConstructor
@Slf4j
public class OCRSpaceServiceImpl implements OCRSpaceService {
    private final RestTemplate restTemplate;
    @Value("${ocr.api-key:helloworld}")
    private String apiKey;
    @Value("${ocr.api-url:https://api.ocr.space/parse/image}")
    private String ocrUrl;
    @Override
    public String extractRawText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo de imagen no puede estar vacío");
        }
        try {
            log.info("Enviando archivo a OCR.Space: {}", file.getOriginalFilename());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
            String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
            boolean isPdf = contentType.equals("application/pdf") || filename.endsWith(".pdf");
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("apikey", apiKey);
            body.add("language", "spa");
            body.add("scale", "true");
            body.add("detectOrientation", "true");
            body.add("OCREngine", "2");
            body.add("isOverlayRequired", "false");
            body.add("file", fileResource);
            if (isPdf) {
                body.add("filetype", "PDF");
            }
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<OCRSpaceResponse> response = restTemplate.postForEntity(ocrUrl, requestEntity, OCRSpaceResponse.class);
            OCRSpaceResponse ocrResponse = response.getBody();
            if (ocrResponse == null) {
                throw new RuntimeException("Respuesta nula del servicio OCR");
            }
            String errorMessage = ocrResponse.getErrorMessage();
            if (StringUtils.hasText(errorMessage)) {
                throw new RuntimeException("Error del servicio OCR: " + errorMessage);
            }
            if (ocrResponse.getParsedResults() == null || ocrResponse.getParsedResults().isEmpty()) {
                return "";
            }
            return ocrResponse.getParsedResults().stream()
                .map(OCRSpaceResponse.ParsedResult::getParsedText)
                .filter(StringUtils::hasText)
                .collect(Collectors.joining("\n"))
                .trim();
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception e) {
            log.error("Error en OCRSpaceService", e);
            throw new RuntimeException("Error al procesar el OCR: " + e.getMessage(), e);
        }
    }
}
