#!/usr/bin/env python3
"""
Database Migration Script for E-commerce Platform
Adds payment_proof_filename column to orders table
"""

import mysql.connector
from mysql.connector import Error

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '', 
    'database': 'ecommerce_db'
}

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"❌ Error connecting to MySQL: {e}")
        return None

def check_column_exists(cursor, table, column):
    """Check if a column exists in a table"""
    cursor.execute(f"""
        SELECT COUNT(*) as count
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = '{DB_CONFIG['database']}' 
        AND TABLE_NAME = '{table}' 
        AND COLUMN_NAME = '{column}'
    """)
    result = cursor.fetchone()
    return result[0] > 0

def migrate_database():
    """Run database migrations"""
    print("🔄 Starting database migration...")
    
    connection = get_db_connection()
    if not connection:
        print("❌ Failed to connect to database")
        return False
    
    cursor = connection.cursor()
    
    try:
        # Add payment_proof_filename column if it doesn't exist
        if not check_column_exists(cursor, 'orders', 'payment_proof_filename'):
            print("📝 Adding payment_proof_filename column to orders table...")
            cursor.execute("""
                ALTER TABLE orders 
                ADD COLUMN payment_proof_filename VARCHAR(255) NULL
                AFTER payment_proof_url
            """)
            connection.commit()
            print("✅ Successfully added payment_proof_filename column")
        else:
            print("ℹ️  payment_proof_filename column already exists, skipping...")
        
        print("✅ Database migration completed successfully!")
        return True
        
    except Error as e:
        print(f"❌ Error during migration: {e}")
        connection.rollback()
        return False
        
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    success = migrate_database()
    exit(0 if success else 1)
