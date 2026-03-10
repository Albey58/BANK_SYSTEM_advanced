-- ==========================================
-- Shared Missions & Approval Protocols - Twin Star Enhancement
-- ==========================================

USE `advanced_bank`;

-- 1. Shared Mission Goals
CREATE TABLE IF NOT EXISTS `savings_missions` (
    `mission_id` CHAR(36) PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `mission_name` VARCHAR(100) NOT NULL,
    `target_amount` DECIMAL(15, 2) NOT NULL,
    `current_progress` DECIMAL(15, 2) DEFAULT 0.00,
    `status` ENUM('active', 'accomplished', 'aborted') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_mission_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Pending Transfers (Approval Protocol)
CREATE TABLE IF NOT EXISTS `pending_transfers` (
    `transfer_id` CHAR(36) PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `beneficiary_account` CHAR(36) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `initiated_by` CHAR(36) NOT NULL,
    `authorized_by` CHAR(36) DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NOT NULL,
    CONSTRAINT `fk_pending_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pending_initiator` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Update Ledger to track initiator (spending attribution)
ALTER TABLE `ledger` 
ADD COLUMN `initiated_by` CHAR(36) DEFAULT NULL;

ALTER TABLE `ledger` 
ADD CONSTRAINT `fk_ledger_user` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

-- 4. Log the system upgrade
INSERT INTO `audit_log` (table_name, record_id, action_type, column_name, old_value, new_value)
VALUES ('system', 'shared_features_init', 'CREATE', 'joint_enhancements', 0.00, 1.00);
