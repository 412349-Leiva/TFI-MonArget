package com.monargent.backend.exception;

import org.springframework.http.HttpStatus;

public class AiServiceUnavailableException extends ApiException {

    public AiServiceUnavailableException(String message) {
        super(message, HttpStatus.SERVICE_UNAVAILABLE);
    }
}
