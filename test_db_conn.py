
import MySQLdb
import os
from dotenv import load_dotenv

load_dotenv()

MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DB = os.getenv('MYSQL_DB', 'advanced_bank')

print(f"Connecting to database: {MYSQL_DB}...")
print(f"User: {MYSQL_USER}")
# Do not print password as it might be logged
try:
    conn = MySQLdb.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        passwd=MYSQL_PASSWORD,
        db=MYSQL_DB
    )
    print("Connection Successful!")
    conn.close()
except Exception as e:
    print(f"Connection Failed: {e}")
