import mysql.connector
from mysql.connector import Error
from config import Config

class Database:
    @staticmethod
    def get_connection():
        """Create and return a database connection"""
        try:
            connection = mysql.connector.connect(
                host=Config.MYSQL_HOST,
                user=Config.MYSQL_USER,
                password=Config.MYSQL_PASSWORD,
                database=Config.MYSQL_DB
            )
            return connection
        except Error as e:
            print(f" Error connecting to MySQL: {e}")
            print(f"   Host: {Config.MYSQL_HOST}")
            print(f"   User: {Config.MYSQL_USER}")
            print(f"   DB: {Config.MYSQL_DB}")
            return None
    
    @staticmethod
    def execute_query(query, params=None, fetch_one=False, fetch_all=False, lastrowid=False):
        """Execute a SQL query with parameters"""
        connection = Database.get_connection()
        if not connection:
            print(" No database connection")
            return None
        
        cursor = None
        try:
            cursor = connection.cursor(dictionary=True)
            print(f" Executing query: {query}")
            print(f"   Params: {params}")
            
            cursor.execute(query, params or ())
            
            if fetch_one:
                result = cursor.fetchone()
                print(f"   Fetch one result: {result}")
            elif fetch_all:
                result = cursor.fetchall()
                print(f"   Fetch all results: {len(result)} rows")
            elif lastrowid:
                result = cursor.lastrowid
                print(f"   Last row ID: {result}")
            else:
                result = None
            
            connection.commit()
            return result
            
        except Error as e:
            print(f" Error executing query: {e}")
            print(f"   Query: {query}")
            print(f"   Params: {params}")
            connection.rollback()
            return None
        finally:
            if cursor:
                cursor.close()
            if connection and connection.is_connected():
                connection.close()