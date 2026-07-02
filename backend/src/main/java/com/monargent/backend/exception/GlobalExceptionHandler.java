package com.monargent.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final Map<String, String> FIELD_LABELS = Map.ofEntries(
        Map.entry("email", "Correo"),
        Map.entry("password", "Contraseña"),
        Map.entry("passwordConfirm", "Confirmación de contraseña"),
        Map.entry("currentPassword", "Contraseña actual"),
        Map.entry("newPassword", "Nueva contraseña"),
        Map.entry("name", "Nombre"),
        Map.entry("title", "Título"),
        Map.entry("description", "Descripción"),
        Map.entry("amount", "Monto"),
        Map.entry("date", "Fecha"),
        Map.entry("type", "Tipo"),
        Map.entry("categoryId", "Categoría"),
        Map.entry("code", "Código"),
        Map.entry("mpAlias", "Alias de Mercado Pago"),
        Map.entry("targetAmount", "Monto objetivo"),
        Map.entry("month", "Mes"),
        Map.entry("year", "Año"),
        Map.entry("maxAmount", "Monto máximo"),
        Map.entry("dayOfMonth", "Día del mes"),
        Map.entry("dueDate", "Fecha de vencimiento"),
        Map.entry("icon", "Ícono"),
        Map.entry("color", "Color"),
        Map.entry("items", "Ítems"),
        Map.entry("movements", "Movimientos")
    );

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception, HttpServletRequest request) {
        return ResponseEntity
            .status(exception.getStatus())
            .body(ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(exception.getStatus().value())
                .error(spanishStatusLabel(exception.getStatus()))
                .message(exception.getMessage())
                .path(request.getRequestURI())
                .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException exception, HttpServletRequest request) {
        String detailedMessage = exception.getBindingResult().getFieldErrors().stream()
            .map(error -> formatFieldLabel(error.getField()) + ": " + error.getDefaultMessage())
            .collect(Collectors.joining(", "));

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Solicitud inválida")
                .message(detailedMessage.isBlank() ? "Revisá los datos ingresados." : detailedMessage)
                .path(request.getRequestURI())
                .build());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleNotReadable(HttpMessageNotReadableException exception, HttpServletRequest request) {
        return ResponseEntity
            .badRequest()
            .body(ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Solicitud inválida")
                .message("El cuerpo de la solicitud es inválido o tiene un valor incorrecto.")
                .path(request.getRequestURI())
                .build());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(NoResourceFoundException exception, HttpServletRequest request) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("No encontrado")
                .message("No se encontró el recurso solicitado.")
                .path(request.getRequestURI())
                .build());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(
        DataIntegrityViolationException exception,
        HttpServletRequest request
    ) {
        log.error("Data integrity error on {}: {}", request.getRequestURI(), exception.getMessage());
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Solicitud inválida")
                .message("No se pudo guardar el dato. Verificá los campos e intentá de nuevo.")
                .path(request.getRequestURI())
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception exception, HttpServletRequest request) {
        log.error("Unhandled exception on {}: {}", request.getRequestURI(), exception.getMessage(), exception);
        return ResponseEntity
            .internalServerError()
            .body(ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(500)
                .error("Error interno")
                .message("Ocurrió un error inesperado. Intentá de nuevo.")
                .path(request.getRequestURI())
                .build());
    }

    private static String formatFieldLabel(String field) {
        return FIELD_LABELS.getOrDefault(field, capitalize(field));
    }

    private static String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    private static String spanishStatusLabel(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Solicitud inválida";
            case UNAUTHORIZED -> "No autorizado";
            case FORBIDDEN -> "Acceso denegado";
            case NOT_FOUND -> "No encontrado";
            case CONFLICT -> "Conflicto";
            case SERVICE_UNAVAILABLE -> "Servicio no disponible";
            case BAD_GATEWAY -> "Error de gateway";
            case INTERNAL_SERVER_ERROR -> "Error interno";
            default -> "Error";
        };
    }
}