#!/usr/bin/env python3
"""
Test script to validate stock replenishment when orders are cancelled or declined.
This test creates a test order, then cancels/declines it and verifies stock is restored.
"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"

def test_cancel_order_stock_replenishment():
    """Test that cancelling an order replenishes stock"""
    print("🔍 Testing cancel order stock replenishment...")
    
    # 1. Register a test user (or use existing)
    print("\n1. Setting up test user...")
    register_data = {
        "username": "test_cancel_user",
        "email": "test_cancel@example.com",
        "password": "test123",
        "first_name": "Test",
        "last_name": "Cancel"
    }
    
    # Try to register (may fail if user exists, that's ok)
    try:
        r = requests.post(BASE_URL + "/auth/register", json=register_data)
        if r.status_code == 201:
            print("   ✓ Test user registered")
        else:
            print("   ℹ Test user may already exist")
    except Exception as e:
        print(f"   ⚠ Register error (may be ok): {e}")
    
    # 2. Login
    print("\n2. Logging in...")
    login_data = {
        "username": "test_cancel_user",
        "password": "test123"
    }
    r = requests.post(BASE_URL + "/auth/login", json=login_data)
    
    if r.status_code != 200:
        print(f"   ❌ Login failed: {r.status_code}")
        print(f"   Response: {r.text}")
        return False
    
    user_data = r.json()
    user_id = user_data['user']['id']
    print(f"   ✓ Logged in as user {user_id}")
    
    # 3. Get a product to order
    print("\n3. Getting product information...")
    r = requests.get(BASE_URL + "/products?page=1&per_page=1")
    if r.status_code != 200:
        print(f"   ❌ Failed to get products: {r.status_code}")
        return False
    
    products_data = r.json()
    if not products_data['products']:
        print("   ❌ No products available")
        return False
    
    product = products_data['products'][0]
    product_id = product['id']
    initial_stock = product['stock_quantity']
    print(f"   ✓ Product: {product['name']}")
    print(f"   ✓ Initial stock: {initial_stock}")
    
    if initial_stock < 2:
        print("   ⚠ Product has low stock, test may not be reliable")
    
    # 4. Add to cart
    print("\n4. Adding product to cart...")
    cart_data = {
        "user_id": user_id,
        "product_id": product_id,
        "quantity": 2
    }
    r = requests.post(BASE_URL + "/cart", json=cart_data)
    if r.status_code != 201:
        print(f"   ❌ Failed to add to cart: {r.status_code}")
        print(f"   Response: {r.text}")
        return False
    print("   ✓ Added 2 items to cart")
    
    # 5. Create order
    print("\n5. Creating order...")
    order_data = {
        "user_id": user_id,
        "shipping_address": "123 Test St",
        "payment_method": "cash_on_delivery"
    }
    r = requests.post(BASE_URL + "/orders", json=order_data)
    if r.status_code != 201:
        print(f"   ❌ Failed to create order: {r.status_code}")
        print(f"   Response: {r.text}")
        return False
    
    order = r.json()['order']
    order_id = order['id']
    print(f"   ✓ Order created: {order_id}")
    
    # 6. Check stock after order (should be reduced)
    print("\n6. Checking stock after order creation...")
    r = requests.get(BASE_URL + f"/products/{product_id}")
    product_after_order = r.json()
    stock_after_order = product_after_order['stock_quantity']
    print(f"   ✓ Stock after order: {stock_after_order}")
    print(f"   ✓ Expected reduction: {initial_stock - stock_after_order} (should be 2)")
    
    if stock_after_order != initial_stock - 2:
        print(f"   ⚠ Stock reduction unexpected: {initial_stock} -> {stock_after_order}")
    
    # 7. Cancel the order
    print("\n7. Cancelling order...")
    r = requests.put(BASE_URL + f"/orders/{order_id}/cancel")
    if r.status_code != 200:
        print(f"   ❌ Failed to cancel order: {r.status_code}")
        print(f"   Response: {r.text}")
        return False
    print("   ✓ Order cancelled successfully")
    
    # 8. Check stock after cancel (should be restored)
    print("\n8. Checking stock after order cancellation...")
    r = requests.get(BASE_URL + f"/products/{product_id}")
    product_after_cancel = r.json()
    stock_after_cancel = product_after_cancel['stock_quantity']
    print(f"   ✓ Stock after cancel: {stock_after_cancel}")
    print(f"   ✓ Initial stock: {initial_stock}")
    
    if stock_after_cancel == initial_stock:
        print("   ✅ PASS: Stock replenished correctly!")
        return True
    else:
        print(f"   ❌ FAIL: Stock not replenished. Expected {initial_stock}, got {stock_after_cancel}")
        return False


def test_decline_order_stock_replenishment():
    """Test that declining an order replenishes stock"""
    print("\n\n🔍 Testing decline order stock replenishment...")
    
    # 1. Register a test user
    print("\n1. Setting up test user...")
    register_data = {
        "username": "test_decline_user",
        "email": "test_decline@example.com",
        "password": "test123",
        "first_name": "Test",
        "last_name": "Decline"
    }
    
    try:
        r = requests.post(BASE_URL + "/auth/register", json=register_data)
        if r.status_code == 201:
            print("   ✓ Test user registered")
        else:
            print("   ℹ Test user may already exist")
    except Exception as e:
        print(f"   ⚠ Register error (may be ok): {e}")
    
    # 2. Login
    print("\n2. Logging in...")
    login_data = {
        "username": "test_decline_user",
        "password": "test123"
    }
    r = requests.post(BASE_URL + "/auth/login", json=login_data)
    
    if r.status_code != 200:
        print(f"   ❌ Login failed: {r.status_code}")
        return False
    
    user_data = r.json()
    user_id = user_data['user']['id']
    print(f"   ✓ Logged in as user {user_id}")
    
    # 3. Get a product
    print("\n3. Getting product information...")
    r = requests.get(BASE_URL + "/products?page=1&per_page=1")
    if r.status_code != 200:
        print(f"   ❌ Failed to get products: {r.status_code}")
        return False
    
    products_data = r.json()
    if not products_data['products']:
        print("   ❌ No products available")
        return False
    
    product = products_data['products'][0]
    product_id = product['id']
    initial_stock = product['stock_quantity']
    print(f"   ✓ Product: {product['name']}")
    print(f"   ✓ Initial stock: {initial_stock}")
    
    # 4. Add to cart
    print("\n4. Adding product to cart...")
    cart_data = {
        "user_id": user_id,
        "product_id": product_id,
        "quantity": 3
    }
    r = requests.post(BASE_URL + "/cart", json=cart_data)
    if r.status_code != 201:
        print(f"   ❌ Failed to add to cart: {r.status_code}")
        return False
    print("   ✓ Added 3 items to cart")
    
    # 5. Create order
    print("\n5. Creating order...")
    order_data = {
        "user_id": user_id,
        "shipping_address": "456 Test Ave",
        "payment_method": "cash_on_delivery"
    }
    r = requests.post(BASE_URL + "/orders", json=order_data)
    if r.status_code != 201:
        print(f"   ❌ Failed to create order: {r.status_code}")
        return False
    
    order = r.json()['order']
    order_id = order['id']
    print(f"   ✓ Order created: {order_id}")
    
    # 6. Check stock after order
    print("\n6. Checking stock after order creation...")
    r = requests.get(BASE_URL + f"/products/{product_id}")
    product_after_order = r.json()
    stock_after_order = product_after_order['stock_quantity']
    print(f"   ✓ Stock after order: {stock_after_order}")
    
    # 7. Decline the order (admin action)
    print("\n7. Declining order (as admin)...")
    decline_data = {
        "decline_reason": "Test decline - insufficient stock verification failed"
    }
    r = requests.put(BASE_URL + f"/admin/orders/{order_id}/decline", json=decline_data)
    if r.status_code != 200:
        print(f"   ❌ Failed to decline order: {r.status_code}")
        print(f"   Response: {r.text}")
        return False
    print("   ✓ Order declined successfully")
    
    # 8. Check stock after decline (should be restored)
    print("\n8. Checking stock after order decline...")
    r = requests.get(BASE_URL + f"/products/{product_id}")
    product_after_decline = r.json()
    stock_after_decline = product_after_decline['stock_quantity']
    print(f"   ✓ Stock after decline: {stock_after_decline}")
    print(f"   ✓ Initial stock: {initial_stock}")
    
    if stock_after_decline == initial_stock:
        print("   ✅ PASS: Stock replenished correctly!")
        return True
    else:
        print(f"   ❌ FAIL: Stock not replenished. Expected {initial_stock}, got {stock_after_decline}")
        return False


def main():
    print("=" * 70)
    print("Order Stock Replenishment Tests")
    print("=" * 70)
    print("\nThis test validates that stock is replenished when orders are")
    print("cancelled by customers or declined by admins.")
    print("\nPrerequisites:")
    print("  - Backend server running on http://127.0.0.1:5000")
    print("  - Database with at least one product with stock >= 5")
    print("=" * 70)
    
    try:
        # Test cancel
        result_cancel = test_cancel_order_stock_replenishment()
        
        # Test decline
        result_decline = test_decline_order_stock_replenishment()
        
        print("\n" + "=" * 70)
        print("Test Results:")
        print("=" * 70)
        print(f"Cancel order stock replenishment: {'✅ PASS' if result_cancel else '❌ FAIL'}")
        print(f"Decline order stock replenishment: {'✅ PASS' if result_decline else '❌ FAIL'}")
        print("=" * 70)
        
        if result_cancel and result_decline:
            print("\n🎉 All tests passed!")
            return 0
        else:
            print("\n⚠️  Some tests failed")
            return 1
            
    except Exception as e:
        print(f"\n❌ Test execution error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    exit(main())
