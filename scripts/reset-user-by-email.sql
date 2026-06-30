-- =============================================================================
-- MonArget — Reset completo de un usuario por email (desarrollo / TFI)
-- =============================================================================
-- Borra TODOS los datos vinculados al user_id y la fila en `users`.
-- También limpia invitaciones y códigos de verificación por email.
--
-- IMPORTANTE: Elimina grupos donde el usuario es miembro o creador (afecta
-- a otros miembros de esos grupos). Solo para entorno local de pruebas.
--
-- Uso (PowerShell / CMD):
--   mysql -u root -p monargent < scripts/reset-user-by-email.sql
--
-- O en MySQL Workbench: editar @target_email y ejecutar todo el script.
-- =============================================================================

USE monargent;

-- >>> Cambiar este email antes de ejecutar <<<
SET @target_email = 'monargent@example.com';

START TRANSACTION;

SET @user_id = (
    SELECT id FROM users WHERE LOWER(email) = LOWER(@target_email) LIMIT 1
);

SELECT IF(
    @user_id IS NULL,
    CONCAT('[INFO] No hay fila en users para ', @target_email, '. Se limpian datos por email.'),
    CONCAT('[INFO] Reseteando usuario id=', @user_id, ' (', @target_email, ')')
) AS paso_1;

-- ---------------------------------------------------------------------------
-- Grupos a eliminar: creados por el usuario o donde es miembro
-- ---------------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS groups_to_drop;
CREATE TEMPORARY TABLE groups_to_drop (
    group_id BIGINT PRIMARY KEY
);

INSERT INTO groups_to_drop (group_id)
SELECT DISTINCT fg.id
FROM financial_groups fg
WHERE @user_id IS NOT NULL
  AND (
      fg.created_by_user_id = @user_id
      OR EXISTS (
          SELECT 1 FROM financial_group_members fgm
          WHERE fgm.group_id = fg.id AND fgm.user_id = @user_id
      )
  );

-- Deudas → gastos → pagos → confirmaciones → invitaciones → invitados → miembros → grupo
DELETE gd FROM group_debts gd
INNER JOIN group_expenses ge ON gd.group_expense_id = ge.id
INNER JOIN groups_to_drop gtd ON ge.group_id = gtd.group_id;

DELETE ge FROM group_expenses ge
INNER JOIN groups_to_drop gtd ON ge.group_id = gtd.group_id;

DELETE gsp FROM group_settlement_payments gsp
INNER JOIN groups_to_drop gtd ON gsp.group_id = gtd.group_id;

DELETE gmc FROM group_movement_confirmations gmc
INNER JOIN groups_to_drop gtd ON gmc.group_id = gtd.group_id;

DELETE gi FROM group_invitations gi
INNER JOIN groups_to_drop gtd ON gi.group_id = gtd.group_id;

DELETE ggm FROM group_guest_members ggm
INNER JOIN groups_to_drop gtd ON ggm.group_id = gtd.group_id;

DELETE fgm FROM financial_group_members fgm
INNER JOIN groups_to_drop gtd ON fgm.group_id = gtd.group_id;

DELETE fg FROM financial_groups fg
INNER JOIN groups_to_drop gtd ON fg.id = gtd.group_id;

-- Referencias sueltas del usuario en grupos que NO se borraron (otros miembros)
DELETE FROM group_debts
WHERE @user_id IS NOT NULL
  AND (debtor_user_id = @user_id OR creditor_user_id = @user_id);

UPDATE group_expenses SET paid_by_user_id = NULL
WHERE @user_id IS NOT NULL AND paid_by_user_id = @user_id;

DELETE FROM group_settlement_payments
WHERE @user_id IS NOT NULL
  AND (marked_by_user_id = @user_id OR confirmed_by_user_id = @user_id);

DELETE FROM group_movement_confirmations
WHERE @user_id IS NOT NULL AND user_id = @user_id;

DELETE FROM financial_group_members
WHERE @user_id IS NOT NULL AND user_id = @user_id;

UPDATE financial_groups SET created_by_user_id = NULL
WHERE @user_id IS NOT NULL AND created_by_user_id = @user_id;

DELETE FROM group_invitations
WHERE @user_id IS NOT NULL AND invited_by_user_id = @user_id;

DELETE FROM group_guest_members
WHERE @user_id IS NOT NULL AND added_by_user_id = @user_id;

-- Invitaciones pendientes dirigidas a este email (aunque el usuario no exista)
DELETE FROM group_invitations
WHERE LOWER(invited_email) = LOWER(@target_email);

-- ---------------------------------------------------------------------------
-- Datos personales del usuario
-- ---------------------------------------------------------------------------
DELETE FROM transactions WHERE @user_id IS NOT NULL AND user_id = @user_id;
DELETE FROM spending_limits WHERE @user_id IS NOT NULL AND user_id = @user_id;
DELETE FROM fixed_expenses WHERE @user_id IS NOT NULL AND user_id = @user_id;
DELETE FROM receipts WHERE @user_id IS NOT NULL AND user_id = @user_id;
DELETE FROM categories WHERE @user_id IS NOT NULL AND user_id = @user_id;
DELETE FROM saving_goals WHERE @user_id IS NOT NULL AND user_id = @user_id;
DELETE FROM notifications WHERE @user_id IS NOT NULL AND user_id = @user_id;
DELETE FROM recommendations WHERE @user_id IS NOT NULL AND user_id = @user_id;
DELETE FROM financial_profiles WHERE @user_id IS NOT NULL AND user_id = @user_id;
DELETE FROM calendar_events WHERE @user_id IS NOT NULL AND user_id = @user_id;

-- Códigos de verificación (registro / reset password) por email
DELETE FROM verification_codes WHERE LOWER(email) = LOWER(@target_email);

-- Usuario
DELETE FROM users WHERE @user_id IS NOT NULL AND id = @user_id;

DROP TEMPORARY TABLE IF EXISTS groups_to_drop;

SELECT CONCAT('[OK] Reset completado para ', @target_email) AS resultado;

COMMIT;

-- Para probar sin aplicar cambios, reemplazar COMMIT por:
-- ROLLBACK;
