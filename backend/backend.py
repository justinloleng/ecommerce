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
# ========== CART ENDPOINTS ==========
@app.route('/api/cart', methods=['GET'])
def get_cart():
    """Get user's cart items"""
    try:
        # Note: For now, we'll use user_id from query param
        # In a real app, you'd get this from session/token
        user_id = request.args.get('user_id', type=int)
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Get cart items with product details
        cursor.execute("""
            SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity,
                   (p.price * c.quantity) as item_total
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
            ORDER BY c.added_at DESC
        """, (user_id,))
        
        cart_items = cursor.fetchall()
        
        # Calculate totals
        cursor.execute("""
            SELECT SUM(p.price * c.quantity) as subtotal,
                   COUNT(*) as item_count
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        
        totals = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Convert Decimal to float
        for item in cart_items:
            if 'price' in item and isinstance(item['price'], Decimal):
                item['price'] = float(item['price'])
            if 'item_total' in item and isinstance(item['item_total'], Decimal):
                item['item_total'] = float(item['item_total'])
        
        return jsonify({
            'items': cart_items,
            'subtotal': float(totals['subtotal']) if totals['subtotal'] else 0,
            'item_count': totals['item_count'] or 0
        }), 200
        
    except Exception as e:
        print(f"❌ Get cart error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    """Add item to cart"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        if not user_id or not product_id:
            return jsonify({'error': 'User ID and Product ID required'}), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Check product availability
        cursor.execute("SELECT stock_quantity FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        
        if not product:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Product not found'}), 404
        
        # Check if already in cart
        cursor.execute("SELECT id, quantity FROM cart WHERE user_id = %s AND product_id = %s", 
                      (user_id, product_id))
        existing_item = cursor.fetchone()
        
        if existing_item:
            # Update quantity
            new_quantity = existing_item['quantity'] + quantity
            if new_quantity > product['stock_quantity']:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Not enough stock available'}), 400
            
            cursor.execute("UPDATE cart SET quantity = %s WHERE id = %s", 
                          (new_quantity, existing_item['id']))
            message = 'Cart updated'
        else:
            # Add new item
            if quantity > product['stock_quantity']:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Not enough stock available'}), 400
            
            cursor.execute("INSERT INTO cart (user_id, product_id, quantity) VALUES (%s, %s, %s)",
                          (user_id, product_id, quantity))
            message = 'Item added to cart'
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': message}), 200
        
    except Exception as e:
        print(f"❌ Add to cart error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart/update/<int:item_id>', methods=['PUT'])
def update_cart_item(item_id):
    """Update cart item quantity"""
    try:
        data = request.get_json()
        quantity = data.get('quantity')
        
        if quantity is None or quantity < 0:
            return jsonify({'error': 'Valid quantity required'}), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Get cart item with product info
        cursor.execute("""
            SELECT c.*, p.stock_quantity 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.id = %s
        """, (item_id,))
        
        cart_item = cursor.fetchone()
        
        if not cart_item:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Cart item not found'}), 404
        
        if quantity == 0:
            # Remove item
            cursor.execute("DELETE FROM cart WHERE id = %s", (item_id,))
            message = 'Item removed from cart'
        else:
            # Check stock
            if quantity > cart_item['stock_quantity']:
                cursor.close()
                conn.close()
                return jsonify({'error': 'Not enough stock available'}), 400
            
            cursor.execute("UPDATE cart SET quantity = %s WHERE id = %s", (quantity, item_id))
            message = 'Cart updated'
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': message}), 200
        
    except Exception as e:
        print(f"❌ Update cart error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart/remove/<int:item_id>', methods=['DELETE'])
def remove_cart_item(item_id):
    """Remove item from cart"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cart WHERE id = %s", (item_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Cart item not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Item removed from cart'}), 200
        
    except Exception as e:
        print(f"❌ Remove cart item error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart/clear/<int:user_id>', methods=['DELETE'])
def clear_cart(user_id):
    """Clear user's entire cart"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Cart cleared'}), 200
        
    except Exception as e:
        print(f"❌ Clear cart error: {e}")
        return jsonify({'error': str(e)}), 500

# ========== ORDER ENDPOINTS ==========
@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create a new order from cart"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        shipping_address = data.get('shipping_address')
        payment_method = data.get('payment_method')
        
        if not all([user_id, shipping_address, payment_method]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if payment_method not in ['cash_on_delivery', 'online_payment']:
            return jsonify({'error': 'Invalid payment method'}), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Get cart items with product details
        cursor.execute("""
            SELECT c.*, p.name, p.price, p.stock_quantity
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        
        cart_items = cursor.fetchall()
        
        if not cart_items:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Validate stock and calculate total
        total_amount = 0
        order_items_data = []
        
        for item in cart_items:
            if item['quantity'] > item['stock_quantity']:
                cursor.close()
                conn.close()
                return jsonify({'error': f'Not enough stock for {item["name"]}'}), 400
            
            item_total = float(item['price']) * item['quantity']
            total_amount += item_total
            
            order_items_data.append({
                'product_id': item['product_id'],
                'quantity': item['quantity'],
                'price': item['price']
            })
        
        # Generate order number
        import uuid
        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # Create order
        cursor.execute("""
            INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, order_number, total_amount, shipping_address, payment_method))
        
        order_id = cursor.lastrowid
        
        # Create order items
        for item_data in order_items_data:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
                VALUES (%s, %s, %s, %s)
            """, (order_id, item_data['product_id'], item_data['quantity'], item_data['price']))
            
            # Update product stock
            cursor.execute("""
                UPDATE products 
                SET stock_quantity = stock_quantity - %s 
                WHERE id = %s
            """, (item_data['quantity'], item_data['product_id']))
        
        # Clear cart after order
        cursor.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
        
        conn.commit()
        
        # Get order details
        cursor.execute("""
            SELECT o.*, 
                   GROUP_CONCAT(CONCAT(oi.quantity, 'x ', p.name) SEPARATOR ', ') as items_summary
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.id = %s
            GROUP BY o.id
        """, (order_id,))
        
        order = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # Convert Decimal to float
        if 'total_amount' in order and isinstance(order['total_amount'], Decimal):
            order['total_amount'] = float(order['total_amount'])
        
        return jsonify({
            'message': 'Order created successfully',
            'order': order
        }), 201
        
    except Exception as e:
        print(f"❌ Create order error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/user/<int:user_id>', methods=['GET'])
def get_user_orders(user_id):
    """Get all orders for a user"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT o.*, 
                   COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = %s
            GROUP BY o.id
            ORDER BY o.created_at DESC
        """, (user_id,))
        
        orders = cursor.fetchall()
        
        # Get order items for each order
        for order in orders:
            cursor.execute("""
                SELECT oi.*, p.name, p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
            """, (order['id'],))
            
            items = cursor.fetchall()
            
            # Convert Decimal to float
            for item in items:
                if 'price_at_time' in item and isinstance(item['price_at_time'], Decimal):
                    item['price_at_time'] = float(item['price_at_time'])
            
            order['items'] = items
        
        cursor.close()
        conn.close()
        
        # Convert Decimal to float
        for order in orders:
            if 'total_amount' in order and isinstance(order['total_amount'], Decimal):
                order['total_amount'] = float(order['total_amount'])
        
        return jsonify(orders), 200
        
    except Exception as e:
        print(f"❌ Get user orders error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Get specific order details"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Get order
        cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Order not found'}), 404
        
        # Get order items
        cursor.execute("""
            SELECT oi.*, p.name, p.image_url, p.description
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
        """, (order_id,))
        
        items = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Convert Decimal to float
        if 'total_amount' in order and isinstance(order['total_amount'], Decimal):
            order['total_amount'] = float(order['total_amount'])
        
        for item in items:
            if 'price_at_time' in item and isinstance(item['price_at_time'], Decimal):
                item['price_at_time'] = float(item['price_at_time'])
        
        order['items'] = items
        
        return jsonify(order), 200
        
    except Exception as e:
        print(f"❌ Get order error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status (for admin)"""
    try:
        data = request.get_json()
        status = data.get('status')
        
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        
        if status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (status, order_id))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Order not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Order status updated'}), 200
        
    except Exception as e:
        print(f"❌ Update order status error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>/payment-proof', methods=['POST'])
def upload_payment_proof(order_id):
    """Upload payment proof for online payment"""
    try:
        # Note: For file upload, you'd need additional handling
        # This is a simplified version
        data = request.get_json()
        payment_proof_url = data.get('payment_proof_url')
        
        if not payment_proof_url:
            return jsonify({'error': 'Payment proof URL required'}), 400
        
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE orders 
            SET payment_proof_url = %s, status = 'processing'
            WHERE id = %s AND payment_method = 'online_payment'
        """, (payment_proof_url, order_id))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Order not found or not online payment'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Payment proof uploaded'}), 200
        
    except Exception as e:
        print(f"❌ Upload payment proof error: {e}")
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
    
    print("\n=== CART ENDPOINTS ===")
    print("   GET  /api/cart?user_id=<id>         - Get cart items")
    print("   POST /api/cart/add                  - Add to cart")
    print("   PUT  /api/cart/update/<id>          - Update cart item")
    print("   DELETE /api/cart/remove/<id>        - Remove cart item")
    print("   DELETE /api/cart/clear/<user_id>    - Clear cart")
    
    print("\n=== ORDER ENDPOINTS ===")
    print("   POST /api/orders                    - Create order")
    print("   GET  /api/orders/user/<user_id>     - Get user orders")
    print("   GET  /api/orders/<order_id>         - Get order details")
    print("   PUT  /api/orders/<id>/status        - Update order status")
    print("   POST /api/orders/<id>/payment-proof - Upload payment proof")
    
    app.run(debug=True, port=5000)