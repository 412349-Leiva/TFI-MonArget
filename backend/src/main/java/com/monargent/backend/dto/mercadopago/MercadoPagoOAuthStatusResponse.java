package com.monargent.backend.dto.mercadopago;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MercadoPagoOAuthStatusResponse {

    private boolean connected;
    private Long mpUserId;
}
