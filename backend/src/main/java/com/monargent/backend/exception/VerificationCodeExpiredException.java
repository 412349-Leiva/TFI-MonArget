package com.monargent.backend.exception;

import org.springframework.http.HttpStatus;

public class VerificationCodeExpiredException extends ApiException {

    public VerificationCodeExpiredException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}