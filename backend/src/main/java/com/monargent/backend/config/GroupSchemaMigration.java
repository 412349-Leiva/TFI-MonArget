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
public class GroupSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        relaxPaidByUserColumn();
        ensurePaidByGuestColumn();
    }

    private void relaxPaidByUserColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE group_expenses MODIFY COLUMN paid_by_user_id BIGINT NULL");
            log.info("group_expenses.paid_by_user_id set to nullable");
        } catch (Exception ex) {
            log.debug("Could not relax paid_by_user_id: {}", ex.getMessage());
        }
    }

    private void ensurePaidByGuestColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE group_expenses ADD COLUMN paid_by_guest_id BIGINT NULL");
            log.info("group_expenses.paid_by_guest_id column added");
        } catch (Exception ex) {
            log.debug("paid_by_guest_id column already present or could not be added: {}", ex.getMessage());
        }

        try {
            jdbcTemplate.execute("""
                ALTER TABLE group_expenses
                ADD CONSTRAINT fk_group_expense_paid_by_guest
                FOREIGN KEY (paid_by_guest_id) REFERENCES group_guest_members(id)
                """);
        } catch (Exception ex) {
            log.debug("FK fk_group_expense_paid_by_guest skipped: {}", ex.getMessage());
        }
    }
}
