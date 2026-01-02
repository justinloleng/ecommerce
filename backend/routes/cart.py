from flask import Blueprint, request, jsonify
import mysql.connector
from mysql.connector import Error
from decimal import Decimal

cart_bp = Blueprint('cart', __name__)

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

# ========== CART ENDPOINTS ==========
@cart_bp.route('', methods=['GET'])
def get_cart():
    """Get user's cart items"""
    try:
        
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

@cart_bp.route('/add', methods=['POST'])
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

@cart_bp.route('/update/<int:item_id>', methods=['PUT'])
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

@cart_bp.route('/remove/<int:item_id>', methods=['DELETE'])
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

@cart_bp.route('/clear/<int:user_id>', methods=['DELETE'])
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
