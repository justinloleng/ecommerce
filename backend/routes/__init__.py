"""
Routes module for E-commerce API
Registers all blueprint routes
"""

from flask import Blueprint

def register_blueprints(app):
    """Register all blueprints with the Flask app"""
    # Note: auth endpoints are handled directly in backend.py
    from .products import products_bp
    from .cart import cart_bp
    from .orders import orders_bp
    from .admin import admin_bp
    
    # Register blueprints with URL prefixes
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    print("✅ All blueprints registered successfully")
