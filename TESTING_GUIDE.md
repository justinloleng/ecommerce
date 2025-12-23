# Testing Guide

This guide helps you test all the new features implemented in this PR.

## Prerequisites

1. **Database Setup**: Run the migration first
   ```bash
   cd backend
   python migrate_database.py
   ```

2. **Start Backend**:
   ```bash
   cd backend
   python backend.py
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   python -m http.server 8000
   ```

4. **Access**: Open http://localhost:8000 in your browser

## Test Scenarios

### Scenario 1: Customer Order Action Buttons

**Goal**: Verify that action buttons appear correctly based on order status

**Steps**:
1. Navigate to http://localhost:8000/orders.html
2. View the sample orders with different statuses

**Expected Results**:
- ✅ **Pending Order (ORD-2024-004)**: Shows only "Cancel Order" button
- ✅ **Processing Order (ORD-2024-003)**: Shows only "View Detail" button
- ✅ **Shipped Order (ORD-2024-002)**: Shows "View Detail" and "Track Order" buttons
- ✅ **In Transit Order (ORD-2024-005)**: Shows only "Track Order" button
- ✅ **Delivered Order (ORD-2024-001)**: Shows only "View Detail" button
- ✅ **Declined Order (ORD-2024-006)**: Shows decline reason in red box

**Test Actions**:
- Click "Cancel Order" - should show confirmation dialog
- Click "View Detail" - should show placeholder alert (to be implemented)
- Click "Track Order" - should show placeholder alert (to be implemented)
- Use filter buttons to view orders by status

---

### Scenario 2: Admin Login & Access Control

**Goal**: Verify admin authentication and access control

**Setup**: Create an admin user in database
```sql
-- If you don't have users, register one first via the frontend
UPDATE users SET is_admin = 1 WHERE email = 'your-email@example.com';
```

**Steps**:
1. Log in with a non-admin user
2. Try to navigate to http://localhost:8000/admin.html
3. **Expected**: Should be redirected to dashboard with "Access denied" message

4. Log in with an admin user
5. Navigate to http://localhost:8000/admin.html
6. **Expected**: Admin panel loads successfully

---

### Scenario 3: Admin Order Management

**Goal**: Test order approval and decline workflow

**Prerequisites**: 
- Be logged in as admin
- Have some pending orders in the database

**Steps**:

#### Test Approval:
1. Navigate to Orders tab in admin panel
2. Find a pending order
3. Click "Approve" button
4. **Expected**: 
   - Success message appears
   - Order status changes to "processing"
   - Order statistics update
   - "Approve" button is replaced with "Mark Shipped" button

#### Test Decline:
1. Find another pending order
2. Click "Decline" button
3. **Expected**: Modal opens asking for decline reason
4. Enter reason: "Product temporarily out of stock"
5. Submit form
6. **Expected**:
   - Success message appears
   - Order status changes to "declined"
   - Order statistics update
7. Log in as the customer who placed that order
8. View orders page
9. **Expected**: Decline reason is visible in red box

#### Test Status Progression:
1. Find a "processing" order
2. Click "Mark Shipped"
3. **Expected**: Order status changes to "shipped"
4. Click "Mark Delivered"
5. **Expected**: Order status changes to "delivered"

---

### Scenario 4: Admin Product Management

**Goal**: Test product CRUD operations

**Steps**:

#### Create Product:
1. Switch to Products tab
2. Click "Add Product" button
3. Fill in the form:
   - Name: "Test Product"
   - Description: "This is a test product"
   - Category: Select any category
   - Price: 99.99
   - Stock: 100
   - Image URL: (optional)
4. Submit form
5. **Expected**:
   - Success message appears
   - Product appears in the product list
   - Product is visible in customer product catalog

#### Edit Product:
1. Find the product you just created
2. Click "Edit" button
3. Modify the stock quantity to 50
4. Submit form
5. **Expected**:
   - Success message appears
   - Product list refreshes with new stock value

#### Delete Product:
1. Find a product to delete
2. Click "Delete" button
3. Confirm deletion
4. **Expected**:
   - Success message appears
   - Product status changes to "Inactive" (soft delete)
   - Product disappears from customer catalog
   - Product still visible in admin panel (marked as Inactive)

---

### Scenario 5: Admin Category Management

**Goal**: Test category CRUD operations

**Steps**:

#### Create Category:
1. Switch to Categories tab
2. Click "Add Category" button
3. Fill in the form:
   - Name: "Test Category"
   - Description: "Testing category functionality"
4. Submit form
5. **Expected**:
   - Success message appears
   - Category appears in the category list
   - Product count shows "0 products"
   - Category is available in product form dropdown

#### Edit Category:
1. Find the category you just created
2. Click "Edit" button
3. Change description
4. Submit form
5. **Expected**:
   - Success message appears
   - Category list refreshes with new description

#### Delete Category (with products):
1. Try to delete a category that has products
2. **Expected**: Delete button should be disabled
3. Tooltip shows "Cannot delete category with products"

#### Delete Category (empty):
1. Find the empty test category
2. Click "Delete" button
3. Confirm deletion
4. **Expected**:
   - Success message appears
   - Category is removed from the list
   - Category is no longer available in dropdowns

---

### Scenario 6: Inventory Management

**Goal**: Test inventory tracking and updates

**Steps**:

1. **Check Initial Stock**:
   - Go to Products tab in admin panel
   - Note the stock quantity of a product (e.g., 100)

2. **Place Order as Customer**:
   - Log in as a customer
   - Add 5 items of that product to cart
   - Complete checkout
   - Create order

3. **Verify Stock Deduction**:
   - Log back in as admin
   - Check product stock in Products tab
   - **Expected**: Stock should be reduced by 5 (now 95)

4. **Update Stock Manually**:
   - Edit the product
   - Change stock to 200
   - Submit form
   - **Expected**: Stock updates to 200

---

### Scenario 7: Order Statistics Dashboard

**Goal**: Verify that statistics update correctly

**Steps**:

1. Note the current statistics on the Orders tab
2. Approve a pending order
3. **Expected**: 
   - Pending count decreases by 1
   - Processing count increases by 1
4. Decline a pending order
5. **Expected**:
   - Pending count decreases by 1
   - Cancelled/Declined count increases by 1
6. Mark a shipped order as delivered
7. **Expected**:
   - Completed count increases by 1

---

## Edge Cases to Test

### Customer Actions
- [ ] Try to cancel a non-pending order (should not have button)
- [ ] Try to view detail of a pending order (should not have button)
- [ ] View declined order and verify reason is displayed
- [ ] Filter orders by different statuses

### Admin Actions
- [ ] Try to approve an already-approved order (button shouldn't appear)
- [ ] Try to decline without entering a reason (should show error)
- [ ] Try to delete a category with products (button should be disabled)
- [ ] Try to edit a non-existent product (should show error)

### Data Validation
- [ ] Create product with negative price (should be rejected)
- [ ] Create product with empty name (should be rejected)
- [ ] Update category with empty name (should be rejected)

---

## Known Limitations (Future Enhancements)

1. **Placeholder Modals**: "View Detail" and "Track Order" show alerts instead of proper modals
2. **No Backend Auth**: Admin endpoints don't verify admin status server-side
3. **No Real-time Updates**: Need to refresh to see changes from other users
4. **Basic Filtering**: Advanced search and filtering not implemented
5. **No Image Upload**: Images can only be specified via URL

---

## Rollback Instructions

If you need to rollback the database changes:

```sql
-- Remove decline_reason column
ALTER TABLE orders DROP COLUMN decline_reason;

-- Remove index
DROP INDEX idx_orders_status ON orders;
```

Then restart the backend server.

---

## Success Criteria

All tests pass if:
- ✅ Order action buttons display correctly for all statuses
- ✅ Admin panel is accessible only to admin users
- ✅ Orders can be approved/declined with proper workflow
- ✅ Products can be created, edited, and soft-deleted
- ✅ Categories can be managed with proper validation
- ✅ Inventory updates correctly after orders
- ✅ Statistics update in real-time
- ✅ Decline reasons are visible to customers
- ✅ No SQL errors or JavaScript console errors
