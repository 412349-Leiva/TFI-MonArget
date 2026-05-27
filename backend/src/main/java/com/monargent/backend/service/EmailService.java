package com.monargent.backend.service;

public interface EmailService {

    void sendVerificationEmail(String to, String code);
}