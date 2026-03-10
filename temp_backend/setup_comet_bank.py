
import MySQLdb
import os
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Database configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DB = os.getenv('MYSQL_DB', 'advanced_bank')

def setup_db():
    print(f"🌌 Initializing Comet Bank Advanced Features in {MYSQL_DB}...")
    try:
        conn = MySQLdb.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            passwd=MYSQL_PASSWORD,
            db=MYSQL_DB
        )
        cursor = conn.cursor()
        
        # 1. Branches Table
        print("🛰️ Setting up Branches...")
        cursor.execute("""
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
        """)
        
        # Seed branches if empty
        cursor.execute("SELECT count(*) FROM branches")
        if cursor.fetchone()[0] == 0:
            print("🌱 Seeding Cosmic Branches...")
            branches = [
                (str(uuid.uuid4()), 'Sirius Prime Command', 'COMET-SR-01', 'Sirius A Orbit', 'Commander Kael'),
                (str(uuid.uuid4()), 'Andromeda Hub', 'COMET-AN-05', 'Andromeda Galaxy Central', 'Exarch Valerius'),
                (str(uuid.uuid4()), 'Lunar Outpost', 'COMET-LU-03', 'Moon - Sea of Tranquility', 'Lunar AI-X1'),
                (str(uuid.uuid4()), 'Martian Citadel', 'COMET-MA-02', 'Mars - Olympus Mons', 'Tharsis Prime')
            ]
            cursor.executemany("INSERT INTO branches (branch_id, branch_name, branch_code, location, manager_name) VALUES (%s, %s, %s, %s, %s)", branches)

        # 2. Account PIN Column
        print("🔐 Verifying Account PIN security...")
        try:
            cursor.execute("SELECT pin_hash FROM accounts LIMIT 1")
        except:
            cursor.execute("ALTER TABLE accounts ADD COLUMN pin_hash VARCHAR(255) DEFAULT NULL AFTER account_type")

        # 3. Savings Missions
        print("🎯 Setting up Savings Missions...")
        cursor.execute("""
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
        """)

        # 4. Pending Transfers
        print("⚖️ Setting up Approval Protocol...")
        cursor.execute("""
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
        """)

        # 5. Ledger Initiator Column
        print("📝 Updating Ledger traceability...")
        try:
            cursor.execute("SELECT initiated_by FROM ledger LIMIT 1")
        except:
            cursor.execute("ALTER TABLE ledger ADD COLUMN initiated_by CHAR(36) DEFAULT NULL")
            cursor.execute("ALTER TABLE ledger ADD CONSTRAINT `fk_ledger_user` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL")

        # 6. Loans Table
        print("⚡ Deploying Credit Pulsar system...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS `loans` (
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
        """)

        # 7. Stellar Standing Column
        print("⭐ Calculating User Constellations...")
        try:
            cursor.execute("SELECT stellar_standing FROM users LIMIT 1")
        except:
            cursor.execute("ALTER TABLE users ADD COLUMN stellar_standing INT DEFAULT 750")

        conn.commit()
        cursor.close()
        conn.close()
        print("\n✅ All systems green! Comet Bank OS v3.0 is ready for orbit.")
        
    except Exception as e:
        print(f"\n❌ Hyperdrive failure: {e}")

if __name__ == "__main__":
    setup_db()
