-- ==========================================
-- Branch Management System - Cosmic Edition
-- ==========================================

USE `advanced_bank`;

-- 1. Create the Branches Table
CREATE TABLE IF NOT EXISTS `branches` (
    `branch_id` CHAR(36) NOT NULL,
    `branch_name` VARCHAR(100) NOT NULL,
    `branch_code` VARCHAR(20) NOT NULL UNIQUE,
    `location` VARCHAR(255) DEFAULT 'Deep Space',
    `manager_name` VARCHAR(100) DEFAULT 'Automated AI',
    `status` ENUM('active', 'decommissioned', 'maintenance') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Add Branch Support to Accounts
-- We add branch_id to track which branch manages which account
ALTER TABLE `accounts` 
ADD COLUMN `branch_id` CHAR(36) DEFAULT NULL,
ADD CONSTRAINT `fk_account_branch` 
FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) 
ON DELETE SET NULL;

-- 3. Seed Initial Cosmic Branches
INSERT INTO `branches` (`branch_id`, `branch_name`, `branch_code`, `location`, `manager_name`) VALUES
(UUID(), 'Sirius Prime Command', 'COMET-SR-01', 'Sirius A Orbit', 'Commander Kael'),
(UUID(), 'Andromeda Hub', 'COMET-AN-05', 'Andromeda Galaxy Central', 'Exarch Valerius'),
(UUID(), 'Lunar Outpost', 'COMET-LU-03', 'Moon - Sea of Tranquility', 'Lunar AI-X1'),
(UUID(), 'Martian Citadel', 'COMET-MA-02', 'Mars - Olympus Mons', 'Tharsis Prime');

-- 4. Create an Audit Log entry for the new system
INSERT INTO `audit_log` (table_name, record_id, action_type, column_name, old_value, new_value)
VALUES ('system', 'branches_init', 'CREATE', 'table_status', 0.00, 1.00);
