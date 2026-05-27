package com.monargent.backend.exception;

import org.springframework.http.HttpStatus;

public class EmailSendException extends ApiException {

    public EmailSendException(String message) {
        super(message, HttpStatus.BAD_GATEWAY);
    }

    public EmailSendException(String message, Throwable cause) {
        super(message + ": " + (cause == null ? "" : cause.getMessage()), HttpStatus.BAD_GATEWAY);
        initCause(cause);
    }
}
