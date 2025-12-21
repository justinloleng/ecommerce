from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import bcrypt
import re
import os

app = Flask(__name__)
CORS(app, supports_credentials=True)

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '', 
    'database': 'ecommerce_db'
}

def get_db():
    """Get database connection"""
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Error as e:
        print(f" Database error: {e}")
        return None

@app.route('/')
def home():
    return jsonify({'message': 'E-commerce API is running! Access /api/health for health check'})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Backend is running'})


@app.route('/api/auth/check-username/<username>', methods=['GET'])
def check_username(username):
    """Check if username is available"""
    conn = get_db()
    if not conn:
        return jsonify({'available': False, 'error': 'Database error'}), 500
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
    exists = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return jsonify({'available': exists is None}), 200

@app.route('/api/auth/check-email/<email>', methods=['GET'])
def check_email(email):
    """Check if email is available"""
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return jsonify({'available': False, 'error': 'Invalid email'}), 400
    
    conn = get_db()
    if not conn:
        return jsonify({'available': False, 'error': 'Database error'}), 500
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    exists = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return jsonify({'available': exists is None}), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Simple register endpoint"""
    try:
        data = request.get_json()
        print(f"📝 Register request: {data}")
        
   
        required = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
    
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', data['email']):
            return jsonify({'error': 'Invalid email'}), 400
        
       
        if len(data['password']) < 6:
            return jsonify({'error': 'Password too short'}), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
  
        cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", 
                      (data['email'], data['username']))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'User already exists'}), 400
        
    
        hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
   
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, first_name, last_name, address, phone)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data['username'],
            data['email'],
            hashed.decode('utf-8'),
            data['first_name'],
            data['last_name'],
            data.get('address', ''),
            data.get('phone', '')
        ))
        
        user_id = cursor.lastrowid
        
    
        cursor.execute("SELECT id, username, email, first_name, last_name, is_active, is_admin FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Registration successful!',
            'user': user
        }), 201
        
    except Exception as e:
        print(f" Register error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Simple login endpoint"""
    try:
        data = request.get_json()
        print(f"📝 Login request: {data.get('email')}")
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
   
        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
      
        if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401
        
       
        user.pop('password_hash', None)
        
        return jsonify({
            'message': 'Login successful',
            'user': user
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current user - THIS NEEDS SESSION MANAGEMENT"""
 
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    cursor = conn.cursor(dictionary=True)
    
 
    cursor.execute("SELECT id, username, email, first_name, last_name, is_active, is_admin FROM users ORDER BY id DESC LIMIT 1")
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if user:
        return jsonify({'user': user}), 200
    return jsonify({'error': 'No users found'}), 404

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    return jsonify({'message': 'Logged out successfully'}), 200

if __name__ == '__main__':
    print("🚀 Starting E-commerce Backend...")
    print("📊 Database config:", DB_CONFIG)
    print("🌐 Available endpoints:")
    print("   GET  /                    - API home")
    print("   GET  /api/health          - Health check")
    print("   GET  /api/auth/check-username/<username>")
    print("   GET  /api/auth/check-email/<email>")
    print("   POST /api/auth/register   - Register")
    print("   POST /api/auth/login      - Login")
    print("   GET  /api/auth/me         - Get current user")
    print("   POST /api/auth/logout     - Logout")
    app.run(debug=True, port=5000)