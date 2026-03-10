-- ==========================================
-- Credit Pulsars - Loan & Stellar Standing System
-- ==========================================

USE `advanced_bank`;

-- 1. Create Loans Table
CREATE TABLE IF NOT EXISTS `loans` (
    `loan_id` CHAR(36) NOT NULL,
    `account_id` CHAR(36) NOT NULL,
    `principal_amount` DECIMAL(15, 2) NOT NULL,
    `total_repayable` DECIMAL(15, 2) NOT NULL,
    `remaining_balance` DECIMAL(15, 2) NOT NULL,
    `interest_rate` DECIMAL(5, 2) DEFAULT 12.00, -- Annual interest rate
    `monthly_repayment` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('active', 'paid', 'defaulted', 'pending_approval') DEFAULT 'active',
    `term_months` INT DEFAULT 12,
    `next_repayment_date` DATE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`loan_id`),
    CONSTRAINT `fk_loan_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Add Stellar Standing (Credit Score) to Users
ALTER TABLE `users` 
ADD COLUMN `stellar_standing` INT DEFAULT 750;

-- 3. Seed some initial audit log for the feature
INSERT INTO `audit_log` (table_name, record_id, action_type, column_name, old_value, new_value)
VALUES ('system', 'loan_system_init', 'CREATE', 'feature_enabled', 0.00, 1.00);
