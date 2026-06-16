package com.monargent.backend.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.monargent.backend.enums.ImportSourceType;
import com.monargent.backend.exception.InvalidRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

public class ImportFileUtilsTest {

    @Test
    void detectSourceType_recognizesImage() {
        MockMultipartFile file = new MockMultipartFile("file", "ticket.jpg", "image/jpeg", new byte[]{1, 2});
        assertEquals(ImportSourceType.IMAGE, ImportFileUtils.detectSourceType(file));
    }

    @Test
    void detectSourceType_recognizesPdf() {
        MockMultipartFile file = new MockMultipartFile("file", "extracto.pdf", "application/pdf", new byte[]{1, 2});
        assertEquals(ImportSourceType.PDF, ImportFileUtils.detectSourceType(file));
    }

    @Test
    void detectSourceType_recognizesExcel() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "movimientos.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            new byte[]{1, 2}
        );
        assertEquals(ImportSourceType.EXCEL, ImportFileUtils.detectSourceType(file));
    }

    @Test
    void detectSourceType_rejectsUnsupportedType() {
        MockMultipartFile file = new MockMultipartFile("file", "data.txt", "text/plain", new byte[]{1});
        assertThrows(InvalidRequestException.class, () -> ImportFileUtils.detectSourceType(file));
    }
}
