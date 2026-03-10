
import MySQLdb
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DB = os.getenv('MYSQL_DB', 'advanced_bank')

def check_and_fix_db():
    print(f"Connecting to database: {MYSQL_DB}...")
    try:
        conn = MySQLdb.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            passwd=MYSQL_PASSWORD,
            db=MYSQL_DB
        )
        cursor = conn.cursor()
        
        # Check if account_members table exists
        try:
            cursor.execute("SELECT 1 FROM account_members LIMIT 1")
            print("Table 'account_members' exists.")
        except Exception as e:
            print(f"Table 'account_members' missing or error: {e}")
            print("Creating 'account_members' table...")
            try:
                cursor.execute("""
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
                """)
                print("Table 'account_members' created successfully.")
                
                # Migrate existing data
                print("Migrating existing ownership data...")
                cursor.execute("""
                INSERT IGNORE INTO `account_members` (account_id, user_id, role)
                SELECT account_id, user_id, 'primary' FROM accounts WHERE user_id IS NOT NULL;
                """)
                conn.commit()
                print("Migration complete.")
                
            except Exception as e2:
                print(f"Failed to create table: {e2}")

        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Database connection error: {e}")

if __name__ == "__main__":
    check_and_fix_db()
