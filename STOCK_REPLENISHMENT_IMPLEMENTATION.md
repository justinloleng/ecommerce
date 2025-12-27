# Stock Replenishment Implementation

## Overview
This document describes the implementation of stock replenishment functionality for cancelled and declined orders in the ecommerce application.

## Problem Statement
When orders were created, product stock quantities were correctly deducted. However, when orders were cancelled (by customers) or declined (by admins), the stock was not being replenished, leading to inventory discrepancies.

## Solution
Implemented stock replenishment logic in both order cancellation and decline endpoints:

### 1. Cancel Order (Customer Action)
**File**: `backend/routes/orders.py`
**Endpoint**: `PUT /api/orders/<order_id>/cancel`

**Implementation**:
```python
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
```

### 2. Decline Order (Admin Action)
**File**: `backend/routes/admin.py`
**Endpoint**: `PUT /api/admin/orders/<order_id>/decline`

**Implementation**:
Same logic as cancel order - fetches order items and replenishes stock before updating order status to 'declined'.

## Order Flow with Stock Management

### Order Creation Flow:
1. Customer adds items to cart
2. Customer places order
3. **Stock is deducted** for each item in the order
4. Order status set to 'pending'

### Order Cancellation Flow (Customer):
1. Customer clicks "Cancel Order" (only for pending orders)
2. System fetches all order items
3. **Stock is replenished** for each item
4. Order status updated to 'cancelled'

### Order Decline Flow (Admin):
1. Admin clicks "Decline Order" and provides reason
2. System fetches all order items
3. **Stock is replenished** for each item
4. Order status updated to 'declined' with reason

## Database Consistency
- All stock operations are performed within the same database transaction
- If any operation fails, the entire transaction is rolled back
- `conn.commit()` is only called after all operations complete successfully

## Testing
Created comprehensive test suite in `backend/test_order_stock_replenishment.py`:

### Test Coverage:
1. **test_cancel_order_stock_replenishment()**
   - Creates a test order with 2 items
   - Verifies stock is deducted after order creation
   - Cancels the order
   - Verifies stock is restored to original level

2. **test_decline_order_stock_replenishment()**
   - Creates a test order with 3 items
   - Verifies stock is deducted after order creation
   - Declines the order (admin action)
   - Verifies stock is restored to original level

### Running Tests:
```bash
cd backend
python test_order_stock_replenishment.py
```

**Prerequisites**:
- Backend server running on http://127.0.0.1:5000
- Database with at least one product with stock >= 5

## Verification
- ✅ Stock replenishment implemented for cancel orders
- ✅ Stock replenishment implemented for decline orders
- ✅ Reports already include declined orders (verified)
- ✅ Frontend UI already functional (verified)
- ✅ Code review passed with no comments
- ✅ Security scan passed with no vulnerabilities

## Related Files
- `backend/routes/orders.py` - Cancel order endpoint
- `backend/routes/admin.py` - Decline order endpoint
- `backend/test_order_stock_replenishment.py` - Test suite
- `frontend/js/orders.js` - Customer orders UI
- `frontend/admin.html` - Admin decline order UI

## Future Considerations
- Consider adding logging for stock changes
- Consider adding audit trail for inventory adjustments
- Consider implementing stock level alerts when inventory is low
