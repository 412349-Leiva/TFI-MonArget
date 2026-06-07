package com.monargent.backend.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

// DESACTIVADO - El proxy maneja CORS
// @Component
// @Order(Ordered.HIGHEST_PRECEDENCE)
public class AbsoluteCorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        try {
            HttpServletResponse response = (HttpServletResponse) res;
            HttpServletRequest request = (HttpServletRequest) req;

            // ALWAYS respond to preflight
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                // Preflight request
                String origin = request.getHeader("Origin");
                response.setHeader("Access-Control-Allow-Origin", origin != null ? origin : "*");
                response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
                response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
                response.setStatus(200);
                response.getWriter().flush();
                return;
            }

            // For non-preflight requests
            String origin = request.getHeader("Origin");
            if (origin != null) {
                response.setHeader("Access-Control-Allow-Origin", origin);
                response.setHeader("Access-Control-Expose-Headers", "Authorization,Content-Type");
            }

            chain.doFilter(req, res);
        } catch (Exception e) {
            // Fallback: just proceed even if something goes wrong
            try {
                chain.doFilter(req, res);
            } catch (Exception ignored) {}
        }
    }
}
