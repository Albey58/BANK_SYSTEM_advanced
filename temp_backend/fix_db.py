
import MySQLdb
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DB = os.getenv('MYSQL_DB', 'advanced_bank')

def fix_database():
    print(f"Connecting to database: {MYSQL_DB}...")
    try:
        conn = MySQLdb.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            passwd=MYSQL_PASSWORD,
            db=MYSQL_DB
        )
        cursor = conn.cursor()
        
        print("Checking for pin_hash column...")
        try:
            cursor.execute("SELECT pin_hash FROM accounts LIMIT 1")
            print("Column 'pin_hash' already exists.")
        except Exception as e:
            print(f"Column missing, adding it... ({e})")
            try:
                # Add the missing column
                cursor.execute("ALTER TABLE accounts ADD COLUMN pin_hash VARCHAR(255) DEFAULT NULL AFTER account_type")
                conn.commit()
                print("Successfully added 'pin_hash' column.")
            except Exception as e2:
                print(f"Failed to add column: {e2}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Database connection error: {e}")

if __name__ == "__main__":
    fix_database()
