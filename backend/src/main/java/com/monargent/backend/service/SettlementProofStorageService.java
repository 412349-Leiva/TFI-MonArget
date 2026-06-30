package com.monargent.backend.service;

import com.monargent.backend.exception.InvalidRequestException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@Slf4j
public class SettlementProofStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf"
    );

    @Value("${app.settlement-proof-dir:uploads/settlement-proofs}")
    private String proofDir;

    public String store(MultipartFile file, Long groupId, String fromMemberKey, String toMemberKey) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("Subí una imagen o PDF del comprobante.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new InvalidRequestException("Formato no válido. Usá JPG, PNG, WEBP, GIF o PDF.");
        }

        String extension = extensionFor(contentType);
        String storedName = "g" + groupId + "-"
            + sanitizeKey(fromMemberKey) + "-"
            + sanitizeKey(toMemberKey) + "-"
            + UUID.randomUUID() + extension;

        try {
            Path directory = Paths.get(proofDir).toAbsolutePath().normalize();
            Files.createDirectories(directory);
            Path target = directory.resolve(storedName).normalize();
            if (!target.startsWith(directory)) {
                throw new InvalidRequestException("Nombre de archivo no válido.");
            }
            file.transferTo(target);
            return storedName;
        } catch (IOException ex) {
            log.error("Could not store settlement proof", ex);
            throw new InvalidRequestException("No se pudo guardar el comprobante. Intentá de nuevo.");
        }
    }

    public Resource load(String storedName) {
        if (storedName == null || storedName.isBlank()) {
            throw new InvalidRequestException("Comprobante no encontrado.");
        }
        try {
            Path directory = Paths.get(proofDir).toAbsolutePath().normalize();
            Path file = directory.resolve(storedName).normalize();
            if (!file.startsWith(directory) || !Files.exists(file)) {
                throw new InvalidRequestException("Comprobante no encontrado.");
            }
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new InvalidRequestException("Comprobante no encontrado.");
            }
            return resource;
        } catch (IOException ex) {
            throw new InvalidRequestException("No se pudo leer el comprobante.");
        }
    }

    public String contentTypeFor(String storedName) {
        String lower = storedName.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        return "image/jpeg";
    }

    private String extensionFor(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            case "application/pdf" -> ".pdf";
            default -> ".jpg";
        };
    }

    private String sanitizeKey(String memberKey) {
        return memberKey.replaceAll("[^a-zA-Z0-9_-]", "");
    }
}
