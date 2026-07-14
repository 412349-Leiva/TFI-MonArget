package com.monargent.backend.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.monargent.backend.dto.ocr.OCRSpaceResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
class OCRSpaceServiceImplTest {

    @Mock private RestTemplate restTemplate;

    @InjectMocks
    private OCRSpaceServiceImpl service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "apiKey", "key");
        ReflectionTestUtils.setField(service, "ocrUrl", "http://ocr.test");
    }

    @Test
    void extractRawText_emptyFile_throws() {
        MockMultipartFile empty = new MockMultipartFile("f", "a.jpg", "image/jpeg", new byte[0]);
        assertThatThrownBy(() -> service.extractRawText(empty))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void extractRawText_success_joinsParsedResults() {
        MockMultipartFile file = new MockMultipartFile("f", "ticket.jpg", "image/jpeg", new byte[]{1, 2});
        OCRSpaceResponse.ParsedResult r1 = new OCRSpaceResponse.ParsedResult();
        r1.setParsedText("LINEA 1");
        OCRSpaceResponse.ParsedResult r2 = new OCRSpaceResponse.ParsedResult();
        r2.setParsedText("LINEA 2");
        OCRSpaceResponse body = new OCRSpaceResponse();
        body.setParsedResults(List.of(r1, r2));
        when(restTemplate.postForEntity(eq("http://ocr.test"), any(), eq(OCRSpaceResponse.class)))
            .thenReturn(ResponseEntity.ok(body));

        assertThat(service.extractRawText(file)).isEqualTo("LINEA 1\nLINEA 2");
    }

    @Test
    void extractRawText_pdf_andNullBody() {
        MockMultipartFile pdf = new MockMultipartFile("f", "doc.pdf", "application/pdf", new byte[]{1});
        when(restTemplate.postForEntity(eq("http://ocr.test"), any(), eq(OCRSpaceResponse.class)))
            .thenReturn(ResponseEntity.ok(null));
        assertThatThrownBy(() -> service.extractRawText(pdf))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Respuesta nula");
    }

    @Test
    void extractRawText_errorMessage_andEmptyResults() {
        MockMultipartFile file = new MockMultipartFile("f", "a.png", "image/png", new byte[]{1});
        OCRSpaceResponse error = new OCRSpaceResponse();
        error.setErrorMessageNode(new ObjectMapper().valueToTree("quota"));
        when(restTemplate.postForEntity(eq("http://ocr.test"), any(), eq(OCRSpaceResponse.class)))
            .thenReturn(ResponseEntity.ok(error));
        assertThatThrownBy(() -> service.extractRawText(file))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Error del servicio OCR");

        OCRSpaceResponse empty = new OCRSpaceResponse();
        empty.setParsedResults(List.of());
        when(restTemplate.postForEntity(eq("http://ocr.test"), any(), eq(OCRSpaceResponse.class)))
            .thenReturn(ResponseEntity.ok(empty));
        assertThat(service.extractRawText(file)).isEmpty();
    }
}
