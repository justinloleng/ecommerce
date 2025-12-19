#!/usr/bin/env python3
"""
Sample data script for the e-commerce application.
Adds categories and products for testing purposes.
"""

from app import create_app
from backend.config.database import db
from backend.models import Category, Product

def add_sample_data():
    """Add sample categories and products"""
    app = create_app()
    with app.app_context():
        # Check if data already exists
        if Category.query.count() > 0:
            print("Sample data already exists. Skipping...")
            return
        
        # Add categories
        categories_data = [
            {
                'name': 'Electronics',
                'description': 'Electronic devices, gadgets, and accessories'
            },
            {
                'name': 'Clothing',
                'description': 'Fashion apparel and accessories'
            },
            {
                'name': 'Books',
                'description': 'Books, magazines, and reading materials'
            },
            {
                'name': 'Home & Kitchen',
                'description': 'Home appliances and kitchen essentials'
            },
            {
                'name': 'Sports & Outdoors',
                'description': 'Sports equipment and outdoor gear'
            }
        ]
        
        categories = []
        for cat_data in categories_data:
            category = Category(**cat_data)
            db.session.add(category)
            categories.append(category)
        
        db.session.flush()
        print(f"✓ Added {len(categories)} categories")
        
        # Add sample products
        products_data = [
            # Electronics
            {
                'name': 'Wireless Headphones',
                'description': 'High-quality wireless headphones with noise cancellation',
                'price': 99.99,
                'stock_quantity': 50,
                'category_id': categories[0].id,
                'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
            },
            {
                'name': 'Smart Watch',
                'description': 'Fitness tracker and smartwatch with heart rate monitor',
                'price': 199.99,
                'stock_quantity': 30,
                'category_id': categories[0].id,
                'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'
            },
            {
                'name': 'Laptop Computer',
                'description': 'Powerful laptop with 16GB RAM and 512GB SSD',
                'price': 899.99,
                'stock_quantity': 15,
                'category_id': categories[0].id,
                'image_url': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'
            },
            # Clothing
            {
                'name': 'Cotton T-Shirt',
                'description': 'Comfortable 100% cotton t-shirt, available in multiple colors',
                'price': 19.99,
                'stock_quantity': 100,
                'category_id': categories[1].id,
                'image_url': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'
            },
            {
                'name': 'Denim Jeans',
                'description': 'Classic blue denim jeans with modern fit',
                'price': 49.99,
                'stock_quantity': 75,
                'category_id': categories[1].id,
                'image_url': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'
            },
            # Books
            {
                'name': 'Python Programming Book',
                'description': 'Comprehensive guide to Python programming',
                'price': 39.99,
                'stock_quantity': 40,
                'category_id': categories[2].id,
                'image_url': 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500'
            },
            {
                'name': 'Science Fiction Novel',
                'description': 'Bestselling science fiction novel',
                'price': 14.99,
                'stock_quantity': 60,
                'category_id': categories[2].id,
                'image_url': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500'
            },
            # Home & Kitchen
            {
                'name': 'Coffee Maker',
                'description': 'Automatic coffee maker with timer and carafe',
                'price': 79.99,
                'stock_quantity': 25,
                'category_id': categories[3].id,
                'image_url': 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500'
            },
            {
                'name': 'Blender',
                'description': 'Powerful blender for smoothies and food processing',
                'price': 59.99,
                'stock_quantity': 35,
                'category_id': categories[3].id,
                'image_url': 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500'
            },
            # Sports & Outdoors
            {
                'name': 'Yoga Mat',
                'description': 'Non-slip yoga mat with carrying strap',
                'price': 29.99,
                'stock_quantity': 80,
                'category_id': categories[4].id,
                'image_url': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'
            },
            {
                'name': 'Running Shoes',
                'description': 'Lightweight running shoes with cushioned sole',
                'price': 89.99,
                'stock_quantity': 45,
                'category_id': categories[4].id,
                'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'
            }
        ]
        
        for prod_data in products_data:
            product = Product(**prod_data)
            db.session.add(product)
        
        db.session.commit()
        print(f"✓ Added {len(products_data)} products")
        print("\nSample data added successfully!")
        print("You can now browse products in the application.")

if __name__ == '__main__':
    add_sample_data()
