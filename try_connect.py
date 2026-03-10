
import MySQLdb
import os
from dotenv import load_dotenv

# Database configuration
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = '' # Empty password
MYSQL_DB = 'advanced_bank'

def try_connect():
    print(f"Connecting to database: {MYSQL_DB}...")
    try:
        conn = MySQLdb.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            passwd=MYSQL_PASSWORD,
            db=MYSQL_DB
        )
        print("Successfully connected with EMPTY password!")
        conn.close()
    except Exception as e:
        print(f"Failed with EMPTY password: {e}")

if __name__ == "__main__":
    try_connect()
