package com.monargent.backend.config;

import com.monargent.backend.entity.User;
import com.monargent.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.seed-test-user", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmailIgnoreCase("monargent@example.com")) {
            User testUser = User.builder()
                .name("Mon")
                .lastname("Argent")
                .email("monargent@example.com")
                .password(passwordEncoder.encode("MonArgent1"))
                .verified(true)
                .build();

            userRepository.save(testUser);
            log.info("Usuario de prueba creado: monargent@example.com / MonArgent1");
        } else {
            log.info("Usuario de prueba ya existe");
        }
    }
}
