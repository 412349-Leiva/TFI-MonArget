package com.monargent.backend.service;

public interface GuestSettlementTokenService {

    String createConfirmToken(Long paymentId);

    Long parsePaymentId(String token);
}
