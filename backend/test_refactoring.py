#!/usr/bin/env python3
"""
Test script to validate the refactored backend structure
"""
import sys
import os

def test_imports():
    """Test that all modules can be imported"""
    print("🔍 Testing imports...")
    
    try:
        # Test importing routes
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        
        from routes import products, cart, orders, admin
        print("✅ All route modules imported successfully")
        
        # Test blueprint existence
        assert hasattr(products, 'products_bp'), "products_bp not found"
        assert hasattr(cart, 'cart_bp'), "cart_bp not found"
        assert hasattr(orders, 'orders_bp'), "orders_bp not found"
        assert hasattr(admin, 'admin_bp'), "admin_bp not found"
        print("✅ All blueprints exist")
        
        return True
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False

def test_endpoint_counts():
    """Count endpoints in each module"""
    print("\n📊 Counting endpoints...")
    
    files = {
        'routes/products.py': 'products_bp.route',
        'routes/cart.py': 'cart_bp.route',
        'routes/orders.py': 'orders_bp.route',
        'routes/admin.py': 'admin_bp.route',
    }
    
    for filename, search_term in files.items():
        try:
            with open(filename, 'r') as f:
                content = f.read()
                count = content.count('@' + search_term.split('.')[0].replace('_bp', '_bp.route'))
                print(f"  {filename}: {count} endpoints")
        except FileNotFoundError:
            print(f"  ⚠️  {filename} not found")

def test_new_features():
    """Check that new features exist"""
    print("\n🆕 Checking new features...")
    
    # Check sales report generation
    try:
        with open('routes/admin.py', 'r') as f:
            content = f.read()
            
        if "'/reports/sales/generate'" in content:
            print("✅ Sales report generation endpoint exists")
        else:
            print("❌ Sales report generation endpoint not found")
            
        if "generate_pdf_report" in content and "generate_docx_report" in content:
            print("✅ PDF and DOCX generation functions exist")
        else:
            print("❌ Report generation functions not found")
            
        if "'/products/<int:product_id>/upload-image'" in content:
            print("✅ Product image upload endpoint exists")
        else:
            print("❌ Product image upload endpoint not found")
            
    except FileNotFoundError:
        print("❌ admin.py not found")

def test_directory_structure():
    """Check directory structure"""
    print("\n📁 Checking directory structure...")
    
    paths = [
        'routes/__init__.py',
        'routes/products.py',
        'routes/cart.py',
        'routes/orders.py',
        'routes/admin.py',
        'static/uploads/products',
    ]
    
    for path in paths:
        if os.path.exists(path):
            print(f"✅ {path} exists")
        else:
            print(f"❌ {path} not found")

def main():
    print("=" * 60)
    print("Backend Refactoring Validation Tests")
    print("=" * 60)
    
    test_imports()
    test_endpoint_counts()
    test_new_features()
    test_directory_structure()
    
    print("\n" + "=" * 60)
    print("✅ Validation complete!")
    print("=" * 60)

if __name__ == '__main__':
    main()
