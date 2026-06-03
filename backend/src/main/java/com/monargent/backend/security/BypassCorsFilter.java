package com.monargent.backend.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filtro que intercepta TODOS los requests ANTES de Spring Security
 * y responde directamente si detecta un error de CORS.
 *
 * Esto evita que Spring Security valide CORS.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class BypassCorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;

        // NUNCA validar CORS - dejar que el proxy lo maneje
        // Solo continuar la cadena
        chain.doFilter(req, res);
    }
}
