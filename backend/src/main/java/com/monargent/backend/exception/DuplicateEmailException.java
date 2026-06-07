package com.monargent.backend.exception;

import org.springframework.http.HttpStatus;

public class DuplicateEmailException extends ApiException {

    public DuplicateEmailException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}