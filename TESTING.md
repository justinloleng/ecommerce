# Testing Guide

This document provides a comprehensive guide for testing the E-Commerce application.

## Prerequisites

1. Application is installed and running
2. Database is initialized with `python init_db.py`
3. Sample data is loaded with `python add_sample_data.py` (optional but recommended)

## Manual Testing Checklist

### 1. Authentication Testing

#### User Registration
- [ ] Navigate to `/register`
- [ ] Fill in all required fields (username, email, password, full name)
- [ ] Submit the form
- [ ] Verify success message and redirect to login
- [ ] Try registering with the same username/email (should fail)
- [ ] Try weak password < 6 characters (should fail)

#### User Login
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Verify successful login and redirect
- [ ] Try invalid credentials (should fail)
- [ ] Verify session persistence across pages

#### User Logout
- [ ] Click logout button
- [ ] Verify redirect to home page
- [ ] Try accessing protected pages (should redirect to login)

### 2. Customer Features Testing

#### Product Catalog
- [ ] Navigate to home page `/`
- [ ] Verify all products are displayed
- [ ] Test search functionality (enter product name)
- [ ] Test category filter
- [ ] Test price range filters (min and max)
- [ ] Verify "Out of Stock" products are clearly marked
- [ ] Click on a product to view details

#### Product Details
- [ ] View product detail page
- [ ] Verify all product information is displayed
- [ ] Test quantity selector
- [ ] Try selecting quantity > stock (should be limited)
- [ ] Add product to cart
- [ ] Verify success message

#### Shopping Cart
- [ ] Navigate to `/customer/cart`
- [ ] Verify cart items are displayed
- [ ] Update item quantity
- [ ] Verify subtotal updates correctly
- [ ] Remove item from cart
- [ ] Verify total calculation is correct
- [ ] Test with empty cart

#### Checkout Process
- [ ] Add items to cart
- [ ] Navigate to checkout
- [ ] Fill in shipping address and phone
- [ ] Select "Cash on Delivery" payment
- [ ] Submit order
- [ ] Verify order confirmation and redirect
- [ ] Verify cart is cleared

#### Checkout with Online Payment
- [ ] Add items to cart
- [ ] Navigate to checkout
- [ ] Select "Online Payment"
- [ ] Upload payment proof screenshot
- [ ] Submit order
- [ ] Verify file upload success
- [ ] Try uploading invalid file type (should fail)

#### Order Tracking
- [ ] Navigate to `/customer/orders`
- [ ] Verify all orders are listed
- [ ] Click on order to view details
- [ ] Verify order items, status, and payment info
- [ ] Check different order statuses (Pending, Approved, Shipped, Delivered, Declined)

### 3. Admin Features Testing

#### Admin Login
- [ ] Login with admin credentials (admin/admin123)
- [ ] Verify redirect to admin dashboard
- [ ] Verify admin navigation menu is visible

#### Admin Dashboard
- [ ] Verify statistics are displayed (products, orders, users)
- [ ] Check quick action buttons work
- [ ] Verify recent orders table

#### Category Management
- [ ] Navigate to `/admin/categories`
- [ ] Add new category
- [ ] Edit existing category
- [ ] Try deleting category with products (should fail)
- [ ] Delete empty category
- [ ] Try creating duplicate category name (should fail)

#### Product Management
- [ ] Navigate to `/admin/products`
- [ ] Add new product with all fields
- [ ] Edit existing product
- [ ] Update stock quantity
- [ ] Deactivate (soft delete) product
- [ ] Verify deactivated products don't show in customer catalog

#### Order Management
- [ ] Navigate to `/admin/orders`
- [ ] Filter orders by status
- [ ] View order details
- [ ] Approve pending order
- [ ] Update order status to "Shipped"
- [ ] Update order status to "Delivered"
- [ ] Decline order with reason
- [ ] Verify stock restoration on decline

#### User Management
- [ ] Navigate to `/admin/users`
- [ ] View all customer accounts
- [ ] Deactivate user account
- [ ] Activate user account
- [ ] Reset user password
- [ ] Verify admin accounts cannot be modified

#### Sales Reports
- [ ] Navigate to `/admin/reports`
- [ ] View daily report
- [ ] View weekly report
- [ ] View monthly report
- [ ] Verify sales totals are correct
- [ ] Check product sales breakdown
- [ ] Verify only approved/shipped/delivered orders are counted

### 4. Security Testing

#### Authentication & Authorization
- [ ] Try accessing admin pages as customer (should fail)
- [ ] Try accessing customer pages when logged out (should redirect)
- [ ] Try accessing other users' orders (should fail)
- [ ] Try modifying other users' cart items (should fail)

#### Input Validation
- [ ] Try SQL injection in search field
- [ ] Try XSS in product descriptions
- [ ] Try negative prices in product form
- [ ] Try negative quantities in cart
- [ ] Try uploading executable files as payment proof

#### Password Security
- [ ] Verify passwords are hashed (check database)
- [ ] Verify bcrypt is used for hashing
- [ ] Test password reset functionality

### 5. Edge Cases & Error Handling

#### Stock Management
- [ ] Try ordering more than available stock
- [ ] Verify stock decreases after order
- [ ] Verify stock increases after order decline
- [ ] Test concurrent orders for same product

#### Payment Processing
- [ ] Submit order without payment proof for online payment (should fail)
- [ ] Upload very large file (should respect size limit)
- [ ] Test with different image formats (PNG, JPG, JPEG)

#### Data Integrity
- [ ] Delete product that has orders (should maintain order history)
- [ ] Delete category with products (should fail)
- [ ] Create product with invalid category (should fail)

### 6. UI/UX Testing

#### Responsiveness
- [ ] Test on desktop browser
- [ ] Test on tablet view
- [ ] Test on mobile view
- [ ] Verify navigation menu collapses on mobile

#### User Experience
- [ ] Verify flash messages appear and auto-dismiss
- [ ] Check loading indicators on form submit
- [ ] Verify confirmation dialogs for delete actions
- [ ] Check breadcrumb navigation
- [ ] Verify consistent styling across pages

#### Accessibility
- [ ] Check form labels are present
- [ ] Verify button contrast ratios
- [ ] Test keyboard navigation
- [ ] Check alt text on images

## Automated Testing

### Running Unit Tests
```bash
# If unit tests are added in the future
python -m pytest tests/
```

### Load Testing
```bash
# Example with Apache Bench
ab -n 1000 -c 10 http://localhost:5000/
```

## Performance Testing

### Database Queries
- [ ] Check query performance with large datasets
- [ ] Verify proper indexing on frequently queried columns
- [ ] Monitor slow query log

### Page Load Times
- [ ] Measure page load time for catalog with many products
- [ ] Check image loading optimization
- [ ] Verify static file caching

## Regression Testing

After any code changes, rerun:
1. Authentication flow (login/logout)
2. Complete purchase flow (add to cart → checkout → order)
3. Admin order processing
4. Product search and filters

## Test Data Cleanup

To reset test data:
```bash
python init_db.py  # Recreates database
python add_sample_data.py  # Adds sample products
```

## Reporting Issues

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/environment details
5. Screenshots if applicable
6. Error messages from logs

## Test Environment Setup

For dedicated test environment:
1. Create separate test database
2. Update `.env` with test database credentials
3. Run application on different port
4. Use test data instead of production data
