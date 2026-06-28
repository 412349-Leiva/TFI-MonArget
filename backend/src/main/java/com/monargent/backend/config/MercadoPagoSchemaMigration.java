package com.monargent.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        addColumn("mp_access_token", "VARCHAR(512) NULL");
        addColumn("mp_refresh_token", "VARCHAR(512) NULL");
        addColumn("mp_token_expires_at", "DATETIME NULL");
        addColumn("mp_user_id", "BIGINT NULL");
        addColumn("mp_connected_at", "DATETIME NULL");
    }

    private void addColumn(String column, String definition) {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN " + column + " " + definition);
            log.info("users.{} column added", column);
        } catch (Exception ex) {
            log.debug("users.{} column already present or could not be added: {}", column, ex.getMessage());
        }
    }
}
