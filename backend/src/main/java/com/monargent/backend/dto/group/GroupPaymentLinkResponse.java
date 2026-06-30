package com.monargent.backend.dto.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupPaymentLinkResponse {

    private String paymentUrl;
    private boolean checkoutAvailable;
    private String creditorAlias;
    private String creditorNick;
}
