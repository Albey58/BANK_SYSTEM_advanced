-- ========================================================
-- COMET BANK - COMPLETE DATABASE MASTER SCRIPT
-- ========================================================
-- This file combines all individual SQL feature scripts into 
-- a single, comprehensive setup file.
-- ========================================================

CREATE DATABASE IF NOT EXISTS `advanced_bank`;
USE `advanced_bank`;

-- ==========================================
-- 1. BASE SCHEMA (From full_database.sql)
-- ==========================================

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Table: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` char(36) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `tax_id` varchar(20) NOT NULL,
  `stellar_standing` INT DEFAULT 750, -- Added from add_loans.sql
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `tax_id` (`tax_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: user_auth
DROP TABLE IF EXISTS `user_auth`;
CREATE TABLE `user_auth` (
  `user_id` char(36) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_locked` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_auth_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: user_documents
DROP TABLE IF EXISTS `user_documents`;
CREATE TABLE `user_documents` (
  `document_id` int NOT NULL AUTO_INCREMENT,
  `user_id` char(36) NOT NULL,
  `document_type` enum('National_ID','Passport','Drivers_License','Other') DEFAULT 'National_ID',
  `document_number` varchar(50) DEFAULT 'PENDING',
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_at` timestamp NULL DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  PRIMARY KEY (`document_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: branches
DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `branch_id` char(36) NOT NULL,
  `branch_name` varchar(100) NOT NULL,
  `branch_code` varchar(20) NOT NULL,
  `location` varchar(255) DEFAULT 'Deep Space',
  `manager_name` varchar(100) DEFAULT 'Automated AI',
  `status` enum('active','decommissioned','maintenance') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `branch_code` (`branch_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: accounts
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `account_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `branch_id` char(36) DEFAULT NULL,
  `account_type` enum('savings','checking') NOT NULL,
  `pin_hash` varchar(255) DEFAULT NULL,
  `balance` decimal(15,2) DEFAULT '0.00',
  `status` enum('active','frozen','closed') DEFAULT 'active',
  PRIMARY KEY (`account_id`),
  KEY `user_id` (`user_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_account_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: audit_log
DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `table_name` varchar(50) DEFAULT NULL,
  `record_id` char(36) DEFAULT NULL,
  `action_type` varchar(20) DEFAULT 'UPDATE',
  `column_name` varchar(50) DEFAULT 'unknown',
  `old_value` decimal(15,2) DEFAULT NULL,
  `new_value` decimal(15,2) DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table: ledger
DROP TABLE IF EXISTS `ledger`;
CREATE TABLE `ledger` (
  `transaction_id` bigint NOT NULL AUTO_INCREMENT,
  `account_id` char(36) DEFAULT NULL,
  `transaction_type` enum('deposit','withdrawal','transfer_in','transfer_out') DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `category` VARCHAR(50) DEFAULT 'Others', -- Added from spending_analysis
  `initiated_by` CHAR(36) DEFAULT NULL,    -- Added from shared_features
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `account_id` (`account_id`),
  KEY `idx_ledger_category` (`category`),
  KEY `idx_ledger_date` (`created_at`),
  CONSTRAINT `ledger_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`),
  CONSTRAINT `fk_ledger_user` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==========================================
-- 2. LOAN SYSTEM (From add_loans.sql)
-- ==========================================

DROP TABLE IF EXISTS `loans`;
CREATE TABLE `loans` (
    `loan_id` CHAR(36) NOT NULL,
    `account_id` CHAR(36) NOT NULL,
    `principal_amount` DECIMAL(15, 2) NOT NULL,
    `total_repayable` DECIMAL(15, 2) NOT NULL,
    `remaining_balance` DECIMAL(15, 2) NOT NULL,
    `interest_rate` DECIMAL(5, 2) DEFAULT 12.00,
    `monthly_repayment` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('active', 'paid', 'defaulted', 'pending_approval') DEFAULT 'active',
    `term_months` INT DEFAULT 12,
    `next_repayment_date` DATE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`loan_id`),
    CONSTRAINT `fk_loan_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==========================================
-- 3. TWIN STAR - JOINT ACCOUNTS (From add_joint_accounts.sql)
-- ==========================================

DROP TABLE IF EXISTS `account_members`;
CREATE TABLE `account_members` (
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

-- Migrate Existing Ownership Data
INSERT IGNORE INTO `account_members` (account_id, user_id, role)
SELECT account_id, user_id, 'primary' FROM accounts WHERE user_id IS NOT NULL;

-- ==========================================
-- 4. SHARED MISSIONS & APPROVAL PROTOCOLS (From add_shared_features.sql)
-- ==========================================

DROP TABLE IF EXISTS `savings_missions`;
CREATE TABLE `savings_missions` (
    `mission_id` CHAR(36) PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `mission_name` VARCHAR(100) NOT NULL,
    `target_amount` DECIMAL(15, 2) NOT NULL,
    `current_progress` DECIMAL(15, 2) DEFAULT 0.00,
    `status` ENUM('active', 'accomplished', 'aborted') DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_mission_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `pending_transfers`;
CREATE TABLE `pending_transfers` (
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

-- ==========================================
-- 5. TRIGGERS & PROCEDURES (From update_audit.sql)
-- ==========================================

DROP TRIGGER IF EXISTS after_account_update;
DELIMITER //
CREATE TRIGGER after_account_update
AFTER UPDATE ON accounts
FOR EACH ROW
BEGIN
    IF OLD.balance <> NEW.balance THEN
        INSERT INTO audit_log (table_name, record_id, action_type, column_name, old_value, new_value)
        VALUES ('accounts', OLD.account_id, 'UPDATE', 'balance', OLD.balance, NEW.balance);
    END IF;
END//
DELIMITER ;

-- ==========================================
-- 6. SEED DATA & INITIALIZATION
-- ==========================================

-- Seed Cosmic Branches
INSERT INTO `branches` (`branch_id`, `branch_name`, `branch_code`, `location`, `manager_name`) VALUES
(UUID(), 'Sirius Prime Command', 'COMET-SR-01', 'Sirius A Orbit', 'Commander Kael'),
(UUID(), 'Andromeda Hub', 'COMET-AN-05', 'Andromeda Galaxy Central', 'Exarch Valerius'),
(UUID(), 'Lunar Outpost', 'COMET-LU-03', 'Moon - Sea of Tranquility', 'Lunar AI-X1'),
(UUID(), 'Martian Citadel', 'COMET-MA-02', 'Mars - Olympus Mons', 'Tharsis Prime');

-- System Initialization Logs
INSERT INTO `audit_log` (table_name, record_id, action_type, column_name, old_value, new_value) VALUES 
('system', 'main_db_init', 'CREATE', 'base_schema', 0.00, 1.00),
('system', 'branches_init', 'CREATE', 'table_status', 0.00, 1.00),
('system', 'loan_system_init', 'CREATE', 'feature_enabled', 0.00, 1.00),
('system', 'joint_accounts_init', 'CREATE', 'membership_table', 0.00, 1.00),
('system', 'shared_features_init', 'CREATE', 'joint_enhancements', 0.00, 1.00),
('system', 'analytics_init', 'CREATE', 'spending_categorization', 0.00, 1.00);

-- Finalize
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
