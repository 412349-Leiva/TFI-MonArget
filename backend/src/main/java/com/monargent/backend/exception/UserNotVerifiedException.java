package com.monargent.backend.exception;

import org.springframework.http.HttpStatus;

public class UserNotVerifiedException extends ApiException {

    public UserNotVerifiedException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}