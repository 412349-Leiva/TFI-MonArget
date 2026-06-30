package com.monargent.backend.service.impl;

import com.monargent.backend.service.GuestPayUrlService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GuestPayUrlServiceImpl implements GuestPayUrlService {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public String buildGuestPayPageUrl(
        String creditorAlias,
        String creditorNick,
        BigDecimal amount,
        String groupTitle
    ) {
        return frontendUrl
            + "/pagar?alias=" + encode(creditorAlias)
            + "&to=" + encode(creditorNick)
            + "&amount=" + amount.setScale(2, RoundingMode.HALF_UP).toPlainString()
            + "&group=" + encode(groupTitle);
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
