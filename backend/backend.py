from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import bcrypt
import re
import os
from decimal import Decimal

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

# ========== AUTH ENDPOINTS ==========
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

# ========== PRODUCT CATALOG ENDPOINTS ==========
@app.route('/api/products/categories', methods=['GET'])
def get_categories():
    """Get all product categories"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM categories ORDER BY name")
        categories = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(categories), 200
        
    except Exception as e:
        print(f"❌ Get categories error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get products with filtering and pagination"""
    try:
        # Get query parameters
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        sort_by = request.args.get('sort_by', 'newest')  # newest, price_low, price_high, name
        
        # Calculate offset for pagination
        offset = (page - 1) * per_page
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Build base query
        query = """
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_active = TRUE
        """
        params = []
        
        # Add filters
        if category_id:
            query += " AND p.category_id = %s"
            params.append(category_id)
        
        if search:
            query += " AND (p.name LIKE %s OR p.description LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
        
        if min_price is not None:
            query += " AND p.price >= %s"
            params.append(min_price)
        
        if max_price is not None:
            query += " AND p.price <= %s"
            params.append(max_price)
        
        # Add sorting
        sort_options = {
            'newest': 'p.created_at DESC',
            'price_low': 'p.price ASC',
            'price_high': 'p.price DESC',
            'name': 'p.name ASC'
        }
        query += f" ORDER BY {sort_options.get(sort_by, 'p.created_at DESC')}"
        
        # Add pagination
        query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        # Execute main query
        cursor.execute(query, params)
        products = cursor.fetchall()
        
        # Convert Decimal to float for JSON serialization
        for product in products:
            if 'price' in product and isinstance(product['price'], Decimal):
                product['price'] = float(product['price'])
        
        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as total 
            FROM products p 
            WHERE p.is_active = TRUE
        """
        count_params = []
        
        if category_id:
            count_query += " AND p.category_id = %s"
            count_params.append(category_id)
        
        if search:
            count_query += " AND (p.name LIKE %s OR p.description LIKE %s)"
            count_params.extend([f"%{search}%", f"%{search}%"])
        
        if min_price is not None:
            count_query += " AND p.price >= %s"
            count_params.append(min_price)
        
        if max_price is not None:
            count_query += " AND p.price <= %s"
            count_params.append(max_price)
        
        cursor.execute(count_query, count_params)
        total_result = cursor.fetchone()
        total = total_result['total'] if total_result else 0
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'products': products,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        print(f"❌ Get products error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product by ID"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = %s AND p.is_active = TRUE
        """, (product_id,))
        
        product = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Convert Decimal to float
        if 'price' in product and isinstance(product['price'], Decimal):
            product['price'] = float(product['price'])
        
        return jsonify(product), 200
        
    except Exception as e:
        print(f"❌ Get product error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/featured', methods=['GET'])
def get_featured_products():
    """Get featured products (for homepage)"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Get 8 random active products as featured
        cursor.execute("""
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_active = TRUE 
            ORDER BY RAND() 
            LIMIT 8
        """)
        
        products = cursor.fetchall()
        
        # Convert Decimal to float
        for product in products:
            if 'price' in product and isinstance(product['price'], Decimal):
                product['price'] = float(product['price'])
        
        cursor.close()
        conn.close()
        
        return jsonify(products), 200
        
    except Exception as e:
        print(f"❌ Get featured products error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting E-commerce Backend...")
    print("📊 Database config:", DB_CONFIG)
    print("🌐 Available endpoints:")
    print("\n=== AUTH ENDPOINTS ===")
    print("   GET  /api/health                    - Health check")
    print("   GET  /api/auth/check-username/<username>")
    print("   GET  /api/auth/check-email/<email>")
    print("   POST /api/auth/register             - Register")
    print("   POST /api/auth/login                - Login")
    print("   GET  /api/auth/me                   - Get current user")
    print("   POST /api/auth/logout               - Logout")
    print("\n=== PRODUCT ENDPOINTS ===")
    print("   GET  /api/products/categories       - Get all categories")
    print("   GET  /api/products                  - Get products (with filters)")
    print("   GET  /api/products/<id>             - Get single product")
    print("   GET  /api/products/featured         - Get featured products")
    print("\n📝 Product filters:")
    print("   ?category_id=1                      - Filter by category")
    print("   ?search=iphone                      - Search products")
    print("   ?min_price=100&max_price=500        - Price range")
    print("   ?page=2&per_page=12                 - Pagination")
    print("   ?sort_by=newest|price_low|price_high|name")
    app.run(debug=True, port=5000)