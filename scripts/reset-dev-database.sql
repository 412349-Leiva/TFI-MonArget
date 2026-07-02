-- =============================================================================
-- MonArget — Wipe completo de la base de datos de desarrollo
-- =============================================================================
-- Vacía TODAS las tablas de la app. Útil para empezar de cero en local/TFI.
-- NO usar en producción.
--
-- Uso:
--   mysql -u root -p monargent < scripts/reset-dev-database.sql
--
-- Tras ejecutar: reiniciar el backend y registrarse de nuevo desde el frontend.
-- (El usuario demo solo se crea si app.seed-test-user=true)
-- =============================================================================

USE monargent;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE group_debts;
TRUNCATE TABLE group_expenses;
TRUNCATE TABLE group_settlement_payments;
TRUNCATE TABLE group_movement_confirmations;
TRUNCATE TABLE group_invitations;
TRUNCATE TABLE group_guest_members;
TRUNCATE TABLE financial_group_members;
TRUNCATE TABLE financial_groups;

TRUNCATE TABLE transactions;
TRUNCATE TABLE spending_limits;
TRUNCATE TABLE fixed_expenses;
TRUNCATE TABLE receipts;
TRUNCATE TABLE categories;
TRUNCATE TABLE saving_goals;
TRUNCATE TABLE notifications;
TRUNCATE TABLE recommendations;
TRUNCATE TABLE financial_profiles;
TRUNCATE TABLE calendar_events;

TRUNCATE TABLE verification_codes;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '[OK] Base de datos monargent vaciada. Reiniciá el backend o registrate de nuevo.' AS resultado;
