-- ==========================================
-- Spending Analysis & Categorization
-- ==========================================

USE `advanced_bank`;

-- 1. Add category to ledger
ALTER TABLE `ledger` 
ADD COLUMN `category` VARCHAR(50) DEFAULT 'Others';

-- 2. Index for performance
CREATE INDEX `idx_ledger_category` ON `ledger` (`category`);
CREATE INDEX `idx_ledger_date` ON `ledger` (`created_at`);

-- 3. Seed some categories for existing data if needed
UPDATE `ledger` SET `category` = 'Transfers' WHERE `transaction_type` LIKE 'transfer%';
UPDATE `ledger` SET `category` = 'Atm/Cash' WHERE `transaction_type` = 'withdrawal';

-- 4. Log the feature enablement
INSERT INTO `audit_log` (table_name, record_id, action_type, column_name, old_value, new_value)
VALUES ('system', 'analytics_init', 'CREATE', 'spending_categorization', 0.00, 1.00);
