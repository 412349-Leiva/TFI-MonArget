package com.monargent.backend.utils;

import java.security.SecureRandom;

public final class VerificationCodeUtils {

    private static final SecureRandom RANDOM = new SecureRandom();

    private VerificationCodeUtils() {
    }

    public static String generateVerificationCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }
}