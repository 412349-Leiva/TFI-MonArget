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
public class SavingGoalSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        ensureIconKeyColumn();
    }

    private void ensureIconKeyColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE saving_goals ADD COLUMN icon_key VARCHAR(30) NOT NULL DEFAULT 'plane'");
            log.info("saving_goals.icon_key column added");
        } catch (Exception ex) {
            log.debug("icon_key column already present or could not be added: {}", ex.getMessage());
        }
    }
}
