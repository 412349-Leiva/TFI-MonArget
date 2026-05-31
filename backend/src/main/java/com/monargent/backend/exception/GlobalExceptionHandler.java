package com.monargent.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception, HttpServletRequest request) {
        return ResponseEntity
            .status(exception.getStatus())
            .body(ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(exception.getStatus().value())
                .error(exception.getStatus().getReasonPhrase())
                .message(exception.getMessage())
                .path(request.getRequestURI())
                .build());
    }

    // 🛠️ AGREGA ESTE MÉTODO PARA CAPTURAR LOS@NotBlank, @Size, ETC. DE LOS DTOs
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException exception, HttpServletRequest request) {
        // Unifica los mensajes de error de todos los campos que hayan fallado en una sola cadena
        String detailedMessage = exception.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining(", "));

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Bad Request (Validation Error)")
                .message(detailedMessage)
                .path(request.getRequestURI())
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception exception, HttpServletRequest request) {
        return ResponseEntity
            .internalServerError()
            .body(ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(500)
                .error("Internal Server Error")
                .message(exception.getMessage())
                .path(request.getRequestURI())
                .build());
    }
}