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
        ensureGuestEmailColumn();
        ensureMovementConfirmationsTable();
        ensureSettlementProofColumns();
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

    private void ensureGuestEmailColumn() {
        try {
            jdbcTemplate.execute("ALTER TABLE group_guest_members ADD COLUMN email VARCHAR(150) NULL");
            log.info("group_guest_members.email column added");
        } catch (Exception ex) {
            log.debug("guest email column already present or could not be added: {}", ex.getMessage());
        }
    }

    private void ensureMovementConfirmationsTable() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS group_movement_confirmations (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    group_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    confirmed_at DATETIME NOT NULL,
                    UNIQUE KEY uk_group_user (group_id, user_id),
                    CONSTRAINT fk_gmc_group FOREIGN KEY (group_id) REFERENCES financial_groups(id),
                    CONSTRAINT fk_gmc_user FOREIGN KEY (user_id) REFERENCES users(id)
                )
                """);
            log.info("group_movement_confirmations table ensured");
        } catch (Exception ex) {
            log.debug("group_movement_confirmations table skipped: {}", ex.getMessage());
        }
    }

    private void ensureSettlementProofColumns() {
        addColumnIfMissing("group_settlement_payments", "proof_stored_name", "VARCHAR(255) NULL");
        addColumnIfMissing("group_settlement_payments", "proof_content_type", "VARCHAR(100) NULL");
        addColumnIfMissing("group_settlement_payments", "proof_uploaded_at", "DATETIME NULL");
        addColumnIfMissing("group_settlement_payments", "confirmed_at", "DATETIME NULL");
        addColumnIfMissing("group_settlement_payments", "confirmed_by_user_id", "BIGINT NULL");
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
            log.info("{}.{} column added", table, column);
        } catch (Exception ex) {
            log.debug("{}.{} column skipped: {}", table, column, ex.getMessage());
        }
    }
}
