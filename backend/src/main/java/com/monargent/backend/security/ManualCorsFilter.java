package com.monargent.backend.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

// DESACTIVADO - el proxy maneja CORS
// @Component
public class ManualCorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String origin = httpRequest.getHeader("Origin");

        // ALWAYS add CORS headers for localhost
        if (origin != null && (origin.contains("localhost") || origin.contains("127.0.0.1"))) {
            httpResponse.setHeader("Access-Control-Allow-Origin", origin);
            httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, TRACE, CONNECT");
            httpResponse.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept, X-Requested-With, X-CSRF-Token");
            httpResponse.setHeader("Access-Control-Expose-Headers", "Authorization, Content-Type, X-Content-Type-Options");
            httpResponse.setHeader("Access-Control-Max-Age", "3600");
            httpResponse.setHeader("Access-Control-Allow-Credentials", "false");
            httpResponse.setHeader("Vary", "Origin");
        }

        // Handle OPTIONS preflight - return 200 OK immediately
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // Continue the chain for other request types
        chain.doFilter(request, response);
    }
}
