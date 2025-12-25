from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Database configuration
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
        print(f"❌ Database error: {e}")
        return None

# Configure Flask for file uploads
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# Serve static files
@app.route('/static/<path:path>')
def send_static(path):
    from flask import send_from_directory
    return send_from_directory('static', path)

# Home and health check endpoints
@app.route('/')
def home():
    return jsonify({'message': 'E-commerce API is running! Access /api/health for health check'})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Backend is running'})

# Register all blueprints
from routes import register_blueprints
register_blueprints(app)

if __name__ == '__main__':
    print("🚀 Starting E-commerce Backend...")
    print("📊 Database config:", DB_CONFIG)
    print("🌐 Available endpoints:")
    print("\n=== CORE ENDPOINTS ===")
    print("   GET  /                                  - Home")
    print("   GET  /api/health                        - Health check")
    
    print("\n=== AUTH ENDPOINTS ===")
    print("   GET  /api/auth/check-username/<username>")
    print("   GET  /api/auth/check-email/<email>")
    print("   POST /api/auth/register                 - Register")
    print("   POST /api/auth/login                    - Login")
    print("   GET  /api/auth/me                       - Get current user")
    print("   POST /api/auth/logout                   - Logout")
    
    print("\n=== PRODUCT ENDPOINTS ===")
    print("   GET  /api/products/categories           - Get all categories")
    print("   GET  /api/products                      - Get products (with filters)")
    print("   GET  /api/products/<id>                 - Get single product")
    print("   GET  /api/products/featured             - Get featured products")
    
    print("\n=== CART ENDPOINTS ===")
    print("   GET  /api/cart?user_id=<id>             - Get cart items")
    print("   POST /api/cart/add                      - Add to cart")
    print("   PUT  /api/cart/update/<id>              - Update cart item")
    print("   DELETE /api/cart/remove/<id>            - Remove cart item")
    print("   DELETE /api/cart/clear/<user_id>        - Clear cart")
    
    print("\n=== ORDER ENDPOINTS ===")
    print("   POST /api/orders                        - Create order")
    print("   GET  /api/orders/user/<user_id>         - Get user orders")
    print("   GET  /api/orders/<order_id>             - Get order details")
    print("   PUT  /api/orders/<id>/status            - Update order status")
    print("   POST /api/orders/<id>/payment-proof     - Upload payment proof")
    print("   PUT  /api/orders/<id>/cancel            - Cancel order (customer)")
    
    print("\n=== ADMIN ENDPOINTS ===")
    print("   GET  /api/admin/orders                  - Get all orders")
    print("   PUT  /api/admin/orders/<id>/approve     - Approve order")
    print("   PUT  /api/admin/orders/<id>/decline     - Decline order with reason")
    print("   POST /api/admin/products                - Create product")
    print("   PUT  /api/admin/products/<id>           - Update product")
    print("   DELETE /api/admin/products/<id>         - Delete product")
    print("   POST /api/admin/products/<id>/upload-image - Upload product image")
    print("   POST /api/admin/categories              - Create category")
    print("   PUT  /api/admin/categories/<id>         - Update category")
    print("   DELETE /api/admin/categories/<id>       - Delete category")
    
    print("\n=== ADMIN REPORTS ENDPOINTS ===")
    print("   GET  /api/admin/reports/sales           - Get sales reports (daily/weekly/monthly)")
    print("   POST /api/admin/reports/sales/generate  - Generate sales report (PDF/DOCX)")
    
    print("\n=== ADMIN USER MANAGEMENT ENDPOINTS ===")
    print("   GET  /api/admin/users                   - Get all users")
    print("   PUT  /api/admin/users/<id>/reset-password - Reset user password")
    print("   PUT  /api/admin/users/<id>/deactivate   - Deactivate user account")
    print("   PUT  /api/admin/users/<id>/activate     - Activate user account")
    
    app.run(debug=True, port=5000)
