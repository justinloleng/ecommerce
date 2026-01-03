"""
Database migration script to add decline_reason column to orders table.
Run this script to update your database schema.
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', ''),
    'database': os.getenv('MYSQL_DB', 'ecommerce_db')
}

def run_migration():
    """Run the database migration"""
    try:
        print("🔄 Starting database migration...")
        print(f"📊 Connecting to database: {DB_CONFIG['database']}")
        
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'orders' 
            AND COLUMN_NAME = 'decline_reason'
        """, (DB_CONFIG['database'],))
        
        exists = cursor.fetchone()[0]
        
        if exists:
            print("ℹ  Column 'decline_reason' already exists. Skipping migration.")
        else:
            print(" Adding 'decline_reason' column to orders table...")
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN decline_reason TEXT NULL 
                COMMENT 'Reason provided by admin when declining an order'
            """)
            print(" Column added successfully!")
        
        # Check if index exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = %s 
            AND TABLE_NAME = 'orders' 
            AND INDEX_NAME = 'idx_orders_status'
        """, (DB_CONFIG['database'],))
        
        index_exists = cursor.fetchone()[0]
        
        if index_exists:
            print("  Index 'idx_orders_status' already exists. Skipping creation.")
        else:
            print(" Adding index on status column...")
            cursor.execute("CREATE INDEX idx_orders_status ON orders(status)")
            print(" Index created successfully!")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n Migration completed successfully!")
        print("\nNew order statuses available:")
        print("  - pending")
        print("  - processing")
        print("  - shipped")
        print("  - in_transit")
        print("  - delivered")
        print("  - cancelled")
        print("  - declined (new - with decline_reason support)")
        
    except Error as e:
        print(f" Migration failed: {e}")
        return False
    
    return True

if __name__ == '__main__':
    success = run_migration()
    exit(0 if success else 1)
