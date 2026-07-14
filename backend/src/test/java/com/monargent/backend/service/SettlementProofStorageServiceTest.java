package com.monargent.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.monargent.backend.exception.InvalidRequestException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

class SettlementProofStorageServiceTest {

    @TempDir
    Path tempDir;

    private SettlementProofStorageService service;

    @BeforeEach
    void setUp() {
        service = new SettlementProofStorageService();
        ReflectionTestUtils.setField(service, "proofDir", tempDir.toString());
    }

    @Test
    void store_load_delete_roundTrip() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "proof.png", "image/png", new byte[]{1, 2, 3, 4});
        String stored = service.store(file, 10L, "user-1!", "guest-2");
        assertThat(stored).contains("g10-").endsWith(".png");
        assertThat(service.contentTypeFor(stored)).isEqualTo("image/png");

        Resource resource = service.load(stored);
        assertThat(resource.exists()).isTrue();
        assertThat(Files.readAllBytes(resource.getFile().toPath())).containsExactly(1, 2, 3, 4);

        service.delete(stored);
        assertThatThrownBy(() -> service.load(stored))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Comprobante no encontrado.");
    }

    @Test
    void store_emptyFile_throws() {
        MockMultipartFile empty = new MockMultipartFile("file", "x.jpg", "image/jpeg", new byte[0]);
        assertThatThrownBy(() -> service.store(empty, 1L, "a", "b"))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessage("Subí una imagen o PDF del comprobante.");
    }

    @Test
    void store_invalidContentType_throws() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "x.txt", "text/plain", new byte[]{1});
        assertThatThrownBy(() -> service.store(file, 1L, "a", "b"))
            .isInstanceOf(InvalidRequestException.class)
            .hasMessageContaining("Formato no válido");
    }

    @Test
    void contentTypeFor_andFilenameHelpers() {
        assertThat(service.contentTypeFor("x.pdf")).isEqualTo("application/pdf");
        assertThat(service.contentTypeFor("x.webp")).isEqualTo("image/webp");
        assertThat(service.contentTypeFor("x.gif")).isEqualTo("image/gif");
        assertThat(service.contentTypeFor("x.jpg")).isEqualTo("image/jpeg");
        assertThat(service.filenameForContentType("application/pdf")).isEqualTo("comprobante.pdf");
        assertThat(service.filenameForContentType("image/png")).isEqualTo("comprobante.png");
        assertThat(service.filenameForContentType(null)).isEqualTo("comprobante.jpg");
    }

    @Test
    void load_blank_throws() {
        assertThatThrownBy(() -> service.load(" "))
            .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void delete_blank_isNoOp() {
        service.delete(null);
        service.delete(" ");
    }

    @Test
    void store_jpegAndPdfExtensions() {
        MockMultipartFile jpeg = new MockMultipartFile(
            "file", "a.jpg", "image/jpeg", new byte[]{9});
        assertThat(service.store(jpeg, 1L, "from", "to")).endsWith(".jpg");

        MockMultipartFile pdf = new MockMultipartFile(
            "file", "a.pdf", "application/pdf", new byte[]{9});
        assertThat(service.store(pdf, 1L, "from", "to")).endsWith(".pdf");
    }
}
