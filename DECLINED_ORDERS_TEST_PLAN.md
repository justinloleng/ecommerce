# Declined Orders Functionality - Test Plan

## Overview
This document outlines the test plan for verifying the declined orders functionality fix.

## Changes Made

### 1. Admin Panel (frontend/admin.html)
- **Added:** New stat card for "Declined Orders" count
- **Updated:** `updateOrderStats()` function to count and display declined orders
- **Location:** Lines 541-550 (new stat card), Lines 1220-1242 (updated function)

### 2. Order Confirmation Page (frontend/order-confirmation.html)
- **Added:** Complete status styles for all order statuses (pending, processing, shipped, in_transit, delivered, cancelled, declined)
- **Added:** Decline reason display section that shows when order is declined
- **Updated:** `displayOrderDetails()` function to show decline reason
- **Location:** Lines 90-126 (styles), Lines 411-421 (decline section), Lines 576-587 (display logic)

## Pre-existing Functionality (Already Working)

### Backend (backend/routes/admin.py)
- Decline order endpoint exists and works correctly
- Replenishes stock when order is declined
- Saves decline reason to database
- Endpoint: `PUT /admin/orders/<order_id>/decline`

### Customer View (frontend/orders.html & frontend/js/orders.js)
- Declined tab filter button already exists
- Filter functionality works correctly
- Decline reason display in order cards already implemented
- Status badge styling already exists

## Test Scenarios

### A. Admin Panel - Declined Orders Count Display

#### Test 1: Initial State
**Steps:**
1. Log in to admin panel (http://localhost:8000/admin.html)
2. Navigate to "Orders" tab
3. Observe the stat cards section

**Expected Result:**
- A "Declined Orders" stat card is visible with count "0" (if no declined orders exist)
- The stat card has a red icon with a ban symbol
- The card is positioned after "Cancelled Orders" card

#### Test 2: Decline an Order
**Steps:**
1. Create a new order as a customer
2. Log in to admin panel
3. Find the pending order
4. Click "Decline" button
5. Enter a decline reason (e.g., "Product out of stock")
6. Submit the decline form
7. Observe the stat cards and order list

**Expected Result:**
- Success toast message appears: "Order declined successfully"
- "Declined Orders" count increases by 1
- Order status in the table changes to "Declined" with red badge
- Order disappears from "Pending" tab when filtered
- Order appears in "Declined" tab when filtered

#### Test 3: Multiple Declined Orders
**Steps:**
1. Decline 2-3 more orders
2. Check the "Declined Orders" count

**Expected Result:**
- Count accurately reflects the number of declined orders
- Each declined order shows with red "Declined" badge

### B. Customer View - Declined Tab Display

#### Test 4: Customer Views Declined Orders
**Steps:**
1. Log in as the customer whose order was declined
2. Navigate to Orders page (http://localhost:8000/orders.html)
3. Click on "Declined" filter button

**Expected Result:**
- Declined orders appear in the list
- Each declined order shows:
  - Red "Declined" status badge
  - Decline reason in a red-bordered box with icon
  - Order items and total amount
  - "View Details" button (no cancel button since order is already declined)

#### Test 5: Declined Orders Not in Other Tabs
**Steps:**
1. From Orders page, click on different filter tabs (Pending, Processing, etc.)
2. Verify declined orders don't appear in wrong tabs

**Expected Result:**
- Declined orders only appear in "All Orders" and "Declined" tabs
- They don't appear in Pending, Processing, Shipped, Delivered, or Cancelled tabs

### C. Order Details Page - Decline Reason Display

#### Test 6: View Declined Order Details
**Steps:**
1. From customer Orders page, click "View Details" on a declined order
2. Observe the order confirmation page

**Expected Result:**
- Order status badge shows "Declined" with red styling
- A prominent decline reason section appears below the order header
- Section has:
  - Red background (#ffebee)
  - Red left border (#f44336)
  - Info icon
  - Bold "Order Declined" heading
  - Decline reason text in gray

#### Test 7: View Non-Declined Order Details
**Steps:**
1. View details of a pending or delivered order

**Expected Result:**
- Decline reason section is NOT visible
- Order displays normally with appropriate status badge

### D. Stock Replenishment

#### Test 8: Verify Stock is Replenished
**Steps:**
1. Note the stock quantity of a product (e.g., Product A has 10 in stock)
2. Create an order with 2 units of Product A
3. Verify stock decreases to 8
4. Admin declines the order
5. Check product stock again

**Expected Result:**
- Product A stock is back to 10
- Stock is correctly replenished when order is declined

### E. Database Verification

#### Test 9: Check Database State
**Steps:**
1. After declining an order, query the database:
   ```sql
   SELECT id, order_number, status, decline_reason FROM orders WHERE status = 'declined';
   ```

**Expected Result:**
- Order has status = 'declined'
- decline_reason column contains the provided reason
- created_at and updated_at timestamps are appropriate

## Visual Verification Checklist

- [ ] Admin stat card for "Declined Orders" is visible and styled correctly
- [ ] Admin stat card icon is appropriate (ban/prohibition icon)
- [ ] Admin order table shows declined orders with red badge
- [ ] Customer orders page shows declined orders in "Declined" tab
- [ ] Customer order cards show decline reason in red-bordered box
- [ ] Order confirmation page shows decline reason when order is declined
- [ ] All status badges use consistent styling
- [ ] Decline reason is properly escaped to prevent XSS

## Edge Cases to Test

### Test 10: Empty Decline Reason
**Steps:**
1. Try to decline an order without entering a reason

**Expected Result:**
- Error message: "Decline reason is required"
- Order is NOT declined

### Test 11: Very Long Decline Reason
**Steps:**
1. Enter a very long decline reason (500+ characters)

**Expected Result:**
- Reason is saved and displayed correctly
- Text wraps appropriately in UI
- No layout breaking

### Test 12: Special Characters in Decline Reason
**Steps:**
1. Enter decline reason with special characters: `<script>alert('test')</script>`

**Expected Result:**
- Text is properly escaped and displayed as plain text
- No JavaScript execution (XSS prevention)

## Browser Compatibility
Test on:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

## Mobile Responsiveness
- [ ] Admin panel stat cards stack properly on mobile
- [ ] Customer orders page works on mobile
- [ ] Decline reason displays properly on small screens

## Performance Considerations
- [ ] Order stats update without full page reload
- [ ] Filtering is smooth with many orders
- [ ] No console errors in browser developer tools

## Rollback Plan
If issues are found:
1. Revert commits:
   ```bash
   git revert HEAD
   ```
2. The backend functionality remains unchanged, so only frontend changes would be reverted
3. Re-test and fix issues before re-deploying

## Success Criteria
- ✅ All stat cards display correct counts
- ✅ Declined orders appear in correct tabs
- ✅ Decline reason is visible to customers
- ✅ Stock is properly replenished
- ✅ No console errors
- ✅ Consistent styling across all pages
- ✅ XSS vulnerabilities are prevented with proper escaping
