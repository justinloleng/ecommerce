# Quick Start - Testing Declined Orders Functionality

## Overview
This guide provides step-by-step instructions for testing the declined orders functionality that was just implemented.

## Prerequisites

### 1. Setup Database
```bash
# Start MySQL
sudo service mysql start

# Create database
sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS ecommerce_db;"

# Run migrations
cd backend
python migrate_database.py
```

### 2. Start Backend Server
```bash
cd backend
pip install -r requirements.txt
python backend.py
```
Server should start on `http://localhost:5000`

### 3. Start Frontend Server
```bash
cd frontend
python -m http.server 8000
```
Frontend available at `http://localhost:8000`

### 4. Create Admin Account
```sql
-- After registering a user, make them admin
sudo mysql -u root ecommerce_db -e "UPDATE users SET is_admin = 1 WHERE email = 'your-email@example.com';"
```

## Quick Test (5 minutes)

### Test 1: Verify Admin Stat Card
1. Open `http://localhost:8000/admin.html`
2. Login with admin credentials
3. Click "Orders" tab
4. **VERIFY:** You should see 5 stat cards including "Declined Orders"
5. **VERIFY:** Icon should be a ban/prohibition symbol (🚫)

### Test 2: Decline an Order
1. Register as a customer at `http://localhost:8000`
2. Add products to cart and place an order
3. Logout and login as admin
4. In Orders tab, find the pending order
5. Click "Decline" button
6. Enter reason: "Testing declined orders functionality"
7. Click Submit
8. **VERIFY:** 
   - Toast message: "Order declined successfully"
   - Declined Orders count increases by 1
   - Order badge changes to red "Declined"

### Test 3: Customer View
1. Logout and login as the customer
2. Navigate to Orders page
3. Click "Declined" filter button
4. **VERIFY:**
   - Order appears with red "Declined" badge
   - Red info box shows: "Order Declined - Reason: Testing declined orders functionality"
5. Click "View Details" button
6. **VERIFY:**
   - Order details page shows declined status
   - Decline reason appears in red-bordered box

## Visual Checklist

### Admin Panel
- [ ] "Declined Orders" stat card visible
- [ ] Count shows correct number (starts at 0)
- [ ] Icon is red ban symbol
- [ ] Card styling matches other stat cards
- [ ] Count updates when order is declined
- [ ] Filter tab "Declined" works

### Customer Orders Page
- [ ] "Declined" filter button exists
- [ ] Clicking filter shows declined orders
- [ ] Red "Declined" badge displays
- [ ] Decline reason shows in red box
- [ ] Box has info icon
- [ ] Text is readable

### Order Details Page
- [ ] Declined status badge shows
- [ ] Decline reason section appears
- [ ] Red background and border
- [ ] Info icon present
- [ ] Reason text displays correctly

## Expected Visual Appearance

### Admin Stat Card (should look like):
```
┌────────────────┐
│  🚫            │
│   5            │
│ Declined Orders│
└────────────────┘
```

### Customer Order Card Decline Reason (should look like):
```
┌─────────────────────────────────────────┐
│ℹ️  Order Declined                       │
│Reason: Testing declined orders          │
│        functionality                     │
└─────────────────────────────────────────┘
```

## Common Issues & Solutions

### Issue: Declined Orders count shows 0
**Solution:** Make sure the order was actually declined (check database):
```sql
sudo mysql -u root ecommerce_db -e "SELECT id, order_number, status, decline_reason FROM orders WHERE status = 'declined';"
```

### Issue: Decline reason not showing
**Solution:** Check that decline_reason was saved:
```sql
sudo mysql -u root ecommerce_db -e "SELECT decline_reason FROM orders WHERE status = 'declined';"
```

### Issue: Stat card not visible
**Solution:** 
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors (F12)
- Verify admin.html was updated correctly

### Issue: 404 or connection errors
**Solution:**
- Verify backend is running on port 5000
- Verify frontend is running on port 8000
- Check firewall settings

## Advanced Testing

### Test Multiple Declined Orders
1. Create and decline 3-5 orders
2. Verify count increments correctly
3. Test filtering between different tabs

### Test Stock Replenishment
1. Note product stock before order (e.g., 10 items)
2. Place order with 2 items (stock should be 8)
3. Admin declines order
4. Check product stock again (should be back to 10)

```sql
-- Check product stock
sudo mysql -u root ecommerce_db -e "SELECT id, name, stock_quantity FROM products WHERE id = 1;"
```

### Test Edge Cases
1. Try declining with empty reason (should show error)
2. Try declining already declined order (should fail)
3. Test with very long decline reason (500+ chars)
4. Test with special characters in reason: `Test <script>alert('xss')</script>`
   - Should display as plain text, not execute

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

## Mobile Testing

1. Open browser dev tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on different screen sizes:
   - [ ] iPhone SE (375px)
   - [ ] iPad (768px)
   - [ ] Desktop (1920px)

**Verify:**
- Stat cards stack properly on mobile
- Filter buttons wrap correctly
- Decline reason box is readable
- All text is visible

## Performance Testing

1. Open browser dev tools
2. Go to Console tab
3. Test the functionality
4. **Verify:** No console errors appear

Expected console output should be clean, no red errors.

## Taking Screenshots

For documentation, take screenshots of:

1. **Admin panel before decline:**
   - Stat cards showing 0 declined orders

2. **Admin decline modal:**
   - Decline reason input form

3. **Admin panel after decline:**
   - Stat cards showing 1 declined order
   - Order table with declined status

4. **Customer orders page:**
   - Declined order with reason box

5. **Order details page:**
   - Declined status and reason display

Save screenshots in a folder for reference.

## Success Criteria

All tests pass if:
- ✅ Declined orders count displays and updates correctly
- ✅ Orders can be declined successfully
- ✅ Decline reasons are visible to customers
- ✅ Filtering works in both admin and customer views
- ✅ Stock is replenished when orders are declined
- ✅ No console errors appear
- ✅ UI is responsive on mobile
- ✅ XSS protection works (special characters escaped)

## Reporting Issues

If you find any issues:

1. Note the exact steps to reproduce
2. Take a screenshot of the issue
3. Check browser console for errors
4. Check backend console for errors
5. Report with:
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots
   - Console errors

## Next Steps After Testing

1. ✅ Verify all tests pass
2. Take screenshots for documentation
3. Update any findings in issues
4. Approve PR for merge
5. Deploy to staging
6. Final production deployment

## Estimated Time

- **Quick Test:** 5 minutes
- **Full Test:** 30 minutes
- **Advanced Test:** 45 minutes
- **All Browsers + Mobile:** 60 minutes

## Notes

- The backend functionality was already working before these changes
- These changes are frontend-only (admin.html and order-confirmation.html)
- No database migrations are needed (decline_reason column already exists)
- No breaking changes were introduced
- The implementation follows existing code patterns

---

**Happy Testing! 🎉**

If everything works as expected, the declined orders functionality is now fully operational and ready for production use.
