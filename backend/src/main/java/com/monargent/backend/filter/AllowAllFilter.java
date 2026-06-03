package com.monargent.backend.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filtro deshabilitado - permitir que los controladores reales manejen las solicitudes
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AllowAllFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        // Solo continuar sin hacer nada
        chain.doFilter(req, res);
    }
}
