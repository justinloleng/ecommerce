from flask import Blueprint, request, jsonify
import mysql.connector
from mysql.connector import Error
from decimal import Decimal
import uuid
import os
from werkzeug.utils import secure_filename

orders_bp = Blueprint('orders', __name__)

def get_db():
    """Get database connection"""
    try:
        DB_CONFIG = {
            'host': 'localhost',
            'user': 'root',
            'password': '', 
            'database': 'ecommerce_db'
        }
        return mysql.connector.connect(**DB_CONFIG)
    except Error as e:
        print(f"❌ Database error: {e}")
        return None

# ========== ORDER ENDPOINTS ==========
@orders_bp.route('', methods=['POST'])
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
        
        # Determine if only selected items should be checked out
        selected_items = data.get('selected_items') or []
        selected_product_ids = []
        if isinstance(selected_items, list) and len(selected_items) > 0:
            try:
                selected_product_ids = [int(it.get('product_id')) for it in selected_items if 'product_id' in it]
            except Exception:
                selected_product_ids = []

        # Get cart items with product details (optionally filtered by selection)
        if selected_product_ids:
            in_clause = ','.join(['%s'] * len(selected_product_ids))
            query = f"""
                SELECT c.*, p.name, p.price, p.stock_quantity
                FROM cart c
                JOIN products p ON c.product_id = p.id
                WHERE c.user_id = %s AND c.product_id IN ({in_clause})
            """
            params = [user_id] + selected_product_ids
            cursor.execute(query, params)
        else:
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
            return jsonify({'error': 'No items selected or cart is empty'}), 400
        
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
        
        # Remove only the checked out items from the cart
        if selected_product_ids:
            in_clause = ','.join(['%s'] * len(selected_product_ids))
            query = f"DELETE FROM cart WHERE user_id = %s AND product_id IN ({in_clause})"
            params = [user_id] + selected_product_ids
            cursor.execute(query, params)
        else:
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

@orders_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_orders(user_id):
    """Get all orders for a user"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT o.id, o.user_id, o.order_number, o.total_amount, 
                   o.shipping_address, o.payment_method, o.status, 
                   o.decline_reason, o.payment_proof_url, o.payment_proof_filename,
                   o.created_at, o.updated_at,
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

@orders_bp.route('/<int:order_id>', methods=['GET'])
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

@orders_bp.route('/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status (for admin)"""
    try:
        data = request.get_json()
        status = data.get('status')
        
        valid_statuses = ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled', 'declined']
        
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

@orders_bp.route('/<int:order_id>/payment-proof', methods=['POST'])
def upload_payment_proof(order_id):
    """Upload payment proof for online payment"""
    try:
        # Check if file is in the request
        if 'payment_proof' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['payment_proof']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'pdf'}
        
        # Check if filename has an extension
        if '.' not in file.filename:
            return jsonify({'error': 'Invalid file type. Allowed: jpg, jpeg, png, gif, pdf'}), 400
        
        parts = file.filename.rsplit('.', 1)
        if len(parts) < 2:
            return jsonify({'error': 'Invalid file type. Allowed: jpg, jpeg, png, gif, pdf'}), 400
            
        file_ext = parts[1].lower()
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: jpg, jpeg, png, gif, pdf'}), 400
        
        # Get the original filename and secure it
        original_filename = secure_filename(file.filename)
        
        # Generate a unique filename using UUID
        unique_filename = f"{uuid.uuid4().hex[:16]}_{original_filename}"
        
        # Create upload directory if it doesn't exist
        # Use relative path from backend directory
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads', 'payment_proofs')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save the file
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # Store URL path in database (relative to static directory)
        payment_proof_url = f"/static/uploads/payment_proofs/{unique_filename}"
        
        # Update database
        conn = get_db()
        if not conn:
            # Clean up uploaded file if database connection fails
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE orders 
            SET payment_proof_url = %s, payment_proof_filename = %s, status = 'processing'
            WHERE id = %s AND payment_method = 'online_payment'
        """, (payment_proof_url, original_filename, order_id))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            # Clean up uploaded file if order not found
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': 'Order not found or not online payment'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Payment proof uploaded successfully',
            'payment_proof_url': payment_proof_url,
            'filename': original_filename
        }), 200
        
    except Exception as e:
        print(f"❌ Upload payment proof error: {e}")
        return jsonify({'error': str(e)}), 500

# ========== ORDER MANAGEMENT ENDPOINTS (CUSTOMER) ==========
@orders_bp.route('/<int:order_id>/cancel', methods=['PUT'])
def cancel_order(order_id):
    """Cancel order (customer action) - only for pending orders"""
    try:
        conn = get_db()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Check if order exists and is pending
        cursor.execute("SELECT status FROM orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Order not found'}), 404
        
        if order['status'] != 'pending':
            cursor.close()
            conn.close()
            return jsonify({'error': 'Only pending orders can be cancelled'}), 400
        
        # Get order items to replenish stock
        cursor.execute("""
            SELECT product_id, quantity 
            FROM order_items 
            WHERE order_id = %s
        """, (order_id,))
        order_items = cursor.fetchall()
        
        # Replenish stock for each item
        for item in order_items:
            cursor.execute("""
                UPDATE products 
                SET stock_quantity = stock_quantity + %s 
                WHERE id = %s
            """, (item['quantity'], item['product_id']))
        
        # Update order status to cancelled
        cursor.execute("UPDATE orders SET status = 'cancelled' WHERE id = %s", (order_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Order cancelled successfully'}), 200
        
    except Exception as e:
        print(f"❌ Cancel order error: {e}")
        return jsonify({'error': str(e)}), 500
