from flask import Blueprint, request, jsonify
import mysql.connector
from mysql.connector import Error
from decimal import Decimal

products_bp = Blueprint('products', __name__)

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

# ========== PRODUCT CATALOG ENDPOINTS ==========
@products_bp.route('/categories', methods=['GET'])
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

@products_bp.route('', methods=['GET'])
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

@products_bp.route('/<int:product_id>', methods=['GET'])
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

@products_bp.route('/featured', methods=['GET'])
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
