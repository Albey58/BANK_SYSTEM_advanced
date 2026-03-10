-- ==========================================
-- Security & Features Upgrade Script
-- Run this script in your MySQL database
-- ==========================================

-- 1. Add PIN support to Accounts
-- We allow NULL initially so existing accounts don't break, 
-- but application logic should enforce it for new ones.
ALTER TABLE accounts ADD COLUMN pin_hash VARCHAR(255) DEFAULT NULL AFTER account_type;

-- Notice: Existing accounts will have no PIN. 
-- The backend will need to handle this (e.g., fail transaction if no PIN set, or prompt to set it).

-- ==========================================
-- Instructions:
-- Run: mysql -u root -p advanced_bank < add_features.sql
-- ==========================================
