package com.monargent.backend.config;

import com.monargent.backend.entity.User;
import com.monargent.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByEmailIgnoreCase("pablo@gmail.com")) {
            User testUser = User.builder()
                .name("Pablo")
                .lastname("Test")
                .email("pablo@gmail.com")
                .password(passwordEncoder.encode("12345"))
                .verified(true)
                .build();

            userRepository.save(testUser);
            log.info("✅ Usuario de prueba creado: pablo@gmail.com / 12345");
        } else {
            log.info("ℹ️ Usuario de prueba ya existe");
        }
    }
}
