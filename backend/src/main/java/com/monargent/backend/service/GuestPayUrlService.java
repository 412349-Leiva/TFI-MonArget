package com.monargent.backend.service;

import java.math.BigDecimal;

public interface GuestPayUrlService {

    String buildGuestPayPageUrl(String creditorAlias, String creditorNick, BigDecimal amount, String groupTitle);
}
