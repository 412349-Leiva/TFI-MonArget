package com.monargent.backend.exception;

import org.springframework.http.HttpStatus;

public class InvalidVerificationCodeException extends ApiException {

    public InvalidVerificationCodeException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}