# Admin Panel Documentation

## Overview
The admin panel provides comprehensive tools for managing the e-commerce platform, including product management, category organization, and order processing.

## Access
- **URL**: `/admin.html`
- **Requirements**: User must be logged in with `is_admin = 1` in the database
- **Redirect**: Non-admin users are automatically redirected to the dashboard

## Features

### 1. Order Management
View and manage all customer orders with real-time statistics.

#### Order Statistics Dashboard
- **Pending Orders**: Orders awaiting admin approval
- **Processing Orders**: Approved orders being prepared
- **Completed Orders**: Successfully delivered orders
- **Cancelled/Declined**: Orders that were cancelled or declined

#### Order Actions
- **Approve Order**: Change pending order status to "processing"
  - Only available for pending orders
  - Allows order fulfillment to begin
  
- **Decline Order**: Reject a pending order with a reason
  - Requires admin to provide a decline reason
  - Reason is visible to the customer in their orders page
  - Only available for pending orders

- **Update Status**: Progress orders through the fulfillment pipeline
  - Processing → Shipped
  - Shipped → Delivered

#### Order Status Flow
```
Pending → [Approve] → Processing → [Mark Shipped] → Shipped → [Mark Delivered] → Delivered
   ↓
[Decline with reason] → Declined
```

### 2. Product Management
Complete CRUD operations for product catalog.

#### Features
- **Add Product**: Create new products with details
  - Name (required)
  - Description (required)
  - Category (required, dropdown from existing categories)
  - Price (required)
  - Stock Quantity (required)
  - Image URL (optional)

- **Edit Product**: Update existing product information
  - Modify any field including stock levels
  - Useful for inventory updates

- **Delete Product**: Soft delete (sets `is_active = FALSE`)
  - Product remains in database but hidden from customers
  - Preserves order history integrity

#### Product Display
- Lists all products with ID, name, category, price, stock, and status
- Shows active/inactive status
- Quick access to edit and delete actions

### 3. Category Management
Organize products into logical categories.

#### Features
- **Add Category**: Create new product categories
  - Name (required)
  - Description (optional)

- **Edit Category**: Update category information
  - Modify name and description

- **Delete Category**: Remove unused categories
  - Only allows deletion if no products are assigned
  - Safety check prevents orphaned products

#### Category Display
- Shows category ID, name, description
- Displays product count per category
- Delete button disabled for categories with products

### 4. Sales Reports
Generate comprehensive sales analytics with flexible time periods.

#### Report Features
- **Period Selection**: Choose reporting granularity
  - Daily: Day-by-day breakdown
  - Weekly: Week-by-week aggregation
  - Monthly: Month-by-month summary

- **Date Filters**: 
  - Start Date: Filter reports from a specific date
  - End Date: Filter reports up to a specific date
  - Custom ranges supported

#### Report Statistics
- **Total Orders**: Overall order count for the period
- **Total Revenue**: Sum of all order amounts
- **Average Order Value**: Mean transaction value
- **Unique Customers**: Number of distinct customers

#### Sales Data Table
- Displays period-by-period breakdown
- Shows orders, revenue, average order, customers, and completed orders
- Sorted by most recent period first

#### Top Selling Products
- Lists best-performing products
- Shows units sold and revenue generated
- Helps identify popular items for inventory planning

### 5. User Management
Manage customer accounts with comprehensive administrative tools.

#### User List Display
- Shows all registered users with key information
- Displays user ID, name, email, phone
- Shows order count and total spending
- Indicates account status (Active/Inactive)
- Shows admin privileges

#### User Actions
- **Reset Password**: Admin can reset any user's password
  - Requires new password (minimum 6 characters)
  - Must confirm password entry
  - User can log in with new password immediately
  - Consider notifying user via email (future enhancement)

- **Deactivate Account**: Temporarily disable user access
  - Prevents user from logging in
  - Preserves user data and order history
  - Can be reversed with activation
  - Use for suspended or problematic accounts

- **Activate Account**: Re-enable a deactivated account
  - Restores user login access
  - All data remains intact
  - User can resume normal operations

## API Endpoints

### Order Management (Admin)
```
GET    /api/admin/orders              - Get all orders with customer info
PUT    /api/admin/orders/:id/approve  - Approve pending order
PUT    /api/admin/orders/:id/decline  - Decline order (requires decline_reason)
PUT    /api/orders/:id/status         - Update order status
```

### Product Management (Admin)
```
POST   /api/admin/products            - Create new product
PUT    /api/admin/products/:id        - Update product
DELETE /api/admin/products/:id        - Delete product (soft delete)
```

### Category Management (Admin)
```
POST   /api/admin/categories          - Create new category
PUT    /api/admin/categories/:id      - Update category
DELETE /api/admin/categories/:id      - Delete category
```

### Customer Order Actions
```
PUT    /api/orders/:id/cancel         - Cancel pending order (customer)
```

### Sales Reports (Admin)
```
GET    /api/admin/reports/sales       - Get sales reports
  Query Parameters:
  - period: daily|weekly|monthly (default: daily)
  - start_date: YYYY-MM-DD (optional)
  - end_date: YYYY-MM-DD (optional)
```

### User Management (Admin)
```
GET    /api/admin/users                         - Get all users with stats
PUT    /api/admin/users/:id/reset-password      - Reset user password (requires new_password)
PUT    /api/admin/users/:id/deactivate          - Deactivate user account
PUT    /api/admin/users/:id/activate            - Activate user account
```

## Database Changes

### Required Migration
Run the database migration to add support for decline reasons:

```bash
cd backend
python migrate_database.py
```

Or manually execute the SQL:
```sql
ALTER TABLE orders 
ADD COLUMN decline_reason TEXT NULL 
COMMENT 'Reason provided by admin when declining an order';

CREATE INDEX idx_orders_status ON orders(status);
```

### Updated Order Statuses
- `pending` - Awaiting admin approval
- `processing` - Approved and being prepared
- `shipped` - Order has been shipped
- `in_transit` - Order is in transit (trackable)
- `delivered` - Order successfully delivered
- `cancelled` - Cancelled by customer
- `declined` - Declined by admin with reason

## Customer-Facing Changes

### Order Action Buttons
Buttons are now conditionally displayed based on order status:

- **Pending Orders**:
  - ✅ Show "Cancel Order" button
  - ❌ Hide "View Detail" button
  - ❌ Hide "Track Order" button

- **Processing/Shipped/Delivered Orders**:
  - ✅ Show "View Detail" button
  - ❌ Hide "Cancel Order" button
  - ✅ Show "Track Order" (only for shipped/in_transit)

- **Declined Orders**:
  - Display decline reason in a prominent notice
  - Shows admin-provided explanation

### Decline Reason Display
When an order is declined, customers see:
```
⚠️ Order Declined
Reason: [Admin's reason for declining]
```

## Security Considerations

### Role-Based Access Control
- Admin panel checks `is_admin` flag on page load
- Non-admin users are redirected
- Backend endpoints should also verify admin status (recommended enhancement)

### Input Validation
- All forms validate required fields
- Price and quantity must be non-negative
- Category deletion checks for dependent products

### Data Integrity
- Product deletion is soft delete (preserves order history)
- Orders maintain snapshot of product price at time of purchase
- Categories cannot be deleted if they have products

## Usage Examples

### Approving an Order
1. Navigate to admin panel
2. View pending orders in the Orders tab
3. Click "Approve" button for desired order
4. Order status changes to "processing"
5. Order now appears in customer's orders with "View Detail" button

### Declining an Order
1. Navigate to admin panel
2. View pending orders in the Orders tab
3. Click "Decline" button for desired order
4. Enter reason in the modal (e.g., "Product out of stock")
5. Submit decline form
6. Customer sees decline reason on their orders page

### Adding a Product
1. Navigate to admin panel
2. Switch to Products tab
3. Click "Add Product" button
4. Fill in required fields:
   - Name: "Wireless Headphones"
   - Description: "High-quality Bluetooth headphones"
   - Category: Select from dropdown
   - Price: 79.99
   - Stock: 50
   - Image URL: (optional)
5. Submit form
6. Product appears in catalog immediately

### Managing Inventory
1. Navigate to Products tab
2. Find product to update
3. Click "Edit" button
4. Update "Stock Quantity" field
5. Save changes
6. Stock level updated in real-time

### Generating Sales Reports
1. Navigate to admin panel
2. Switch to Reports tab
3. Select period (Daily, Weekly, or Monthly)
4. (Optional) Set start and end dates for custom range
5. Click "Generate Report" button
6. View:
   - Overall statistics cards (total orders, revenue, avg order value, customers)
   - Period-by-period breakdown table
   - Top selling products list

### Resetting a User's Password
1. Navigate to admin panel
2. Switch to Users tab
3. Find the user in the list
4. Click the key icon (🔑) button
5. Enter new password (minimum 6 characters)
6. Confirm password
7. Click "Reset Password"
8. User can now log in with the new password

### Deactivating a User Account
1. Navigate to Users tab
2. Find the user with "Active" status
3. Click the ban icon (🚫) button
4. Confirm the action
5. User status changes to "Inactive"
6. User cannot log in until reactivated

### Activating a User Account
1. Navigate to Users tab
2. Find the user with "Inactive" status
3. Click the check icon (✓) button
4. Confirm the action
5. User status changes to "Active"
6. User can log in normally

## Troubleshooting

### "Cannot delete category with existing products"
- Move products to different category first
- Or delete/deactivate all products in category
- Then retry category deletion

### Admin panel shows "Access denied"
- Verify user's `is_admin` flag is set to 1 in database
- Log out and log back in
- Check browser console for errors

### Orders not loading
- Verify backend is running on port 5000
- Check database connection in backend logs
- Ensure CORS is properly configured

## Future Enhancements
- [ ] Backend authentication middleware for admin endpoints
- [ ] Bulk product import/export
- [ ] Advanced order filtering and search
- [ ] Product image upload functionality
- [ ] Email notifications for order status changes and password resets
- [x] Sales analytics and reporting (COMPLETED)
- [ ] Inventory low-stock alerts
- [ ] Export sales reports to PDF/DOC format
- [x] User management (reset password, activate/deactivate) (COMPLETED)
- [ ] Audit logs for admin actions
- [ ] Role-based permissions (different admin levels)
