package com.monargent.backend.service;

public interface MercadoPagoOAuthStateService {

    String generateState(Long userId);

    Long validateAndExtractUserId(String state);
}
