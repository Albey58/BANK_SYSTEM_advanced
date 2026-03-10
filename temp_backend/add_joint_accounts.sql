-- ==========================================
-- Joint Account Support - "Twin Star" Implementation
-- ==========================================

USE `advanced_bank`;

-- 1. Create Account Members Table
-- This table allows multiple users to be linked to a single account
CREATE TABLE IF NOT EXISTS `account_members` (
    `membership_id` INT AUTO_INCREMENT PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `role` ENUM('primary', 'joint_owner', 'custodian') DEFAULT 'joint_owner',
    `status` ENUM('active', 'invited', 'suspended') DEFAULT 'active',
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_account` (`account_id`, `user_id`),
    CONSTRAINT `fk_member_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_member_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Migrate Existing Ownership Data
-- We move existing primary owners from the `accounts` table to the new `account_members` table
-- This ensures that everyone who already has an account retains access.
INSERT IGNORE INTO `account_members` (account_id, user_id, role)
SELECT account_id, user_id, 'primary' FROM accounts WHERE user_id IS NOT NULL;

-- 3. Update Audit Log
INSERT INTO `audit_log` (table_name, record_id, action_type, column_name, old_value, new_value)
VALUES ('system', 'joint_accounts_init', 'CREATE', 'membership_table', 0.00, 1.00);

-- NOTE: In the future, we can remove the `user_id` column from the `accounts` table gt
-- because ownership is now handled by the `account_members` table. 
-- However, for backward compatibility with existing code, we keep it for now.
