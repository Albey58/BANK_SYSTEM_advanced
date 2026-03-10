-- ==========================================
-- Audit Log Enhancement Script
-- Run this script in your MySQL database
-- ==========================================

-- 1. Update audit_log table structure
ALTER TABLE audit_log ADD COLUMN action_type VARCHAR(20) DEFAULT 'UPDATE' AFTER record_id;
ALTER TABLE audit_log ADD COLUMN column_name VARCHAR(50) DEFAULT 'unknown' AFTER action_type;

-- 2. Create Trigger for Account Balance Updates
DROP TRIGGER IF EXISTS after_account_update;

DELIMITER //

CREATE TRIGGER after_account_update
AFTER UPDATE ON accounts
FOR EACH ROW
BEGIN
    -- Log Balance Changes
    IF OLD.balance <> NEW.balance THEN
        INSERT INTO audit_log (table_name, record_id, action_type, column_name, old_value, new_value)
        VALUES ('accounts', OLD.account_id, 'UPDATE', 'balance', OLD.balance, NEW.balance);
    END IF;

    -- Log Status Changes (Note: old_value/new_value are decimal, so we might store 0/1 or NULL if strict, 
    -- but for simplicity in this schema we'll just log the event with NULL values or create a text column. 
    -- Since the existing table uses DECIMAL for values, we can't store text like 'active'. 
    -- We will just log the fact it changed, or use 0/1 conventions if applicable. 
    -- For now, let's stick to balance which fits the schema perfectly.)
END//

DELIMITER ;

-- ==========================================
-- Instructions:
-- Run: mysql -u root -p advanced_bank < update_audit.sql
-- ==========================================
