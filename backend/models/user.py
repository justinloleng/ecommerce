from flask_login import UserMixin
from flask_bcrypt import Bcrypt
from database import Database
import re
from datetime import datetime

bcrypt = Bcrypt()

class User(UserMixin):
    def __init__(self, id, username, email, password_hash, first_name, last_name, 
                 address=None, phone=None, is_active=1, is_admin=0, 
                 created_at=None, updated_at=None):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.first_name = first_name
        self.last_name = last_name
        self.address = address
        self.phone = phone
        self.is_active = bool(is_active) if is_active is not None else True
        self.is_admin = bool(is_admin) if is_admin is not None else False
        self.created_at = created_at
        self.updated_at = updated_at
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        query = "SELECT * FROM users WHERE id = %s"
        user_data = Database.execute_query(query, (user_id,), fetch_one=True)
        if user_data:
            return User(**user_data)
        return None
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        query = "SELECT * FROM users WHERE email = %s"
        user_data = Database.execute_query(query, (email,), fetch_one=True)
        if user_data:
            return User(**user_data)
        return None
    
    @staticmethod
    def get_by_username(username):
        """Get user by username"""
        query = "SELECT * FROM users WHERE username = %s"
        user_data = Database.execute_query(query, (username,), fetch_one=True)
        if user_data:
            return User(**user_data)
        return None
    
    @staticmethod
    def create(username, email, password, first_name, last_name, address=None, phone=None):
        """Create a new user"""
        try:
            
            password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
            
            query = """
            INSERT INTO users 
            (username, email, password_hash, first_name, last_name, address, phone) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            params = (username, email, password_hash, first_name, last_name, address, phone)
            user_id = Database.execute_query(query, params, lastrowid=True)
            
            if user_id:
                #fetch mo ung new user 
                return User.get_by_id(user_id)
            return None
            
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    def verify_password(self, password):
        """Verify password hash"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def to_dict(self):
        """Convert user to dictionary (without password)
        
        Note: is_active and is_admin are stored internally as booleans for Python clarity,
        but converted to integers (0/1) for the API response to maintain compatibility
        with frontend strict equality checks (e.g., is_admin === 1).
        """
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'address': self.address,
            'phone': self.phone,
            'is_active': 1 if self.is_active else 0,
            'is_admin': 1 if self.is_admin else 0,
            'created_at': str(self.created_at) if self.created_at else None,
            'updated_at': str(self.updated_at) if self.updated_at else None
        }