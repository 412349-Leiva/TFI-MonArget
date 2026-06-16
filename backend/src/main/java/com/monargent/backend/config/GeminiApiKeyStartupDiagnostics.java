package com.monargent.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertySource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class GeminiApiKeyStartupDiagnostics implements ApplicationListener<ApplicationReadyEvent> {

    private static final String PROPERTY_KEY = "GEMINI_API_KEY";

    private final ConfigurableEnvironment environment;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        String apiKey = environment.getProperty(PROPERTY_KEY);
        boolean loaded = StringUtils.hasText(apiKey);
        String source = findPropertySource(PROPERTY_KEY);

        log.info("[DIAG] GEMINI_API_KEY loaded: {}", loaded);
        if (loaded && apiKey != null) {
            log.info("[DIAG] GEMINI_API_KEY first 6 chars: {}", apiKey.substring(0, Math.min(6, apiKey.length())));
            log.info("[DIAG] GEMINI_API_KEY length: {}", apiKey.length());
        } else {
            log.info("[DIAG] GEMINI_API_KEY first 6 chars: (n/a)");
            log.info("[DIAG] GEMINI_API_KEY length: 0");
        }
        log.info("[DIAG] GEMINI_API_KEY property source: {}", source);
        log.info("[DIAG] gemini.api-url: {}", environment.getProperty("gemini.api-url", "not set"));
        log.info("[DIAG] gemini.model: {}", environment.getProperty("gemini.model", "not set"));
    }

    private String findPropertySource(String propertyName) {
        for (PropertySource<?> propertySource : environment.getPropertySources()) {
            if (propertySource.containsProperty(propertyName)) {
                return propertySource.getName();
            }
        }
        return "not found";
    }
}
