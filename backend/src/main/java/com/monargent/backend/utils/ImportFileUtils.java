package com.monargent.backend.utils;

import com.monargent.backend.enums.ImportSourceType;
import com.monargent.backend.exception.InvalidRequestException;
import org.springframework.web.multipart.MultipartFile;

public final class ImportFileUtils {

    private static final long MAX_BYTES = 5 * 1024 * 1024;

    private ImportFileUtils() {
    }

    public static ImportSourceType detectSourceType(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("El archivo no puede estar vacio");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new InvalidRequestException("El archivo supera el limite de 5MB");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();

        if (contentType.startsWith("image/") || hasExtension(filename, ".jpg", ".jpeg", ".png")) {
            return ImportSourceType.IMAGE;
        }
        if (contentType.equals("application/pdf") || filename.endsWith(".pdf")) {
            return ImportSourceType.PDF;
        }
        if (isExcel(contentType, filename)) {
            return ImportSourceType.EXCEL;
        }

        throw new InvalidRequestException("Tipo de archivo no soportado. Use imagen, PDF o Excel");
    }

    private static boolean isExcel(String contentType, String filename) {
        return contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            || contentType.equals("application/vnd.ms-excel")
            || hasExtension(filename, ".xlsx", ".xls");
    }

    private static boolean hasExtension(String filename, String... extensions) {
        for (String extension : extensions) {
            if (filename.endsWith(extension)) {
                return true;
            }
        }
        return false;
    }
}
