# Backend Refactoring Documentation

## Overview
The backend has been successfully refactored from a monolithic 1733-line `backend.py` file into a modular structure using Flask Blueprints, with additional features for sales report generation and product image uploads.

## File Structure

### Before Refactoring
```
backend/
├── backend.py (1733 lines - all routes in one file)
├── routes/
│   └── auth.py (not used)
└── ...
```

### After Refactoring
```
backend/
├── backend.py (226 lines - core setup + auth endpoints)
├── routes/
│   ├── __init__.py (blueprint registration)
│   ├── auth.py (not used - auth kept in main backend.py)
│   ├── products.py (238 lines - 4 endpoints)
│   ├── cart.py (267 lines - 5 endpoints)
│   ├── orders.py (388 lines - 6 endpoints)
│   └── admin.py (1455 lines - 16 endpoints)
├── static/
│   └── uploads/
│       └── products/ (product image uploads)
└── ...
```

## Route Modules

### 1. `backend.py` - Core Application
**Lines:** 226  
**Responsibilities:**
- Flask app initialization
- CORS configuration
- Database configuration
- File upload configuration
- Static file serving
- Auth endpoints (check-username, check-email, register, login, logout, me)
- Blueprint registration

**Key Endpoints:**
- `GET /` - Home
- `GET /api/health` - Health check
- `GET /api/auth/check-username/<username>`
- `GET /api/auth/check-email/<email>`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### 2. `routes/products.py` - Product Catalog
**Lines:** 238  
**Endpoints:** 4

**Routes:**
- `GET /api/products/categories` - Get all product categories
- `GET /api/products` - Get products with filtering and pagination
- `GET /api/products/<int:product_id>` - Get single product by ID
- `GET /api/products/featured` - Get featured products (8 random)

**Features:**
- Category filtering
- Search by name/description
- Price range filtering
- Sorting (newest, price_low, price_high, name)
- Pagination support

### 3. `routes/cart.py` - Shopping Cart
**Lines:** 267  
**Endpoints:** 5

**Routes:**
- `GET /api/cart?user_id=<id>` - Get user's cart items
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/<int:item_id>` - Update cart item quantity
- `DELETE /api/cart/remove/<int:item_id>` - Remove item from cart
- `DELETE /api/cart/clear/<int:user_id>` - Clear user's entire cart

**Features:**
- Stock validation
- Automatic cart item merging
- Subtotal calculation

### 4. `routes/orders.py` - Order Management
**Lines:** 388  
**Endpoints:** 6

**Routes:**
- `POST /api/orders` - Create order from cart
- `GET /api/orders/user/<int:user_id>` - Get all orders for a user
- `GET /api/orders/<int:order_id>` - Get specific order details
- `PUT /api/orders/<int:order_id>/status` - Update order status (admin)
- `POST /api/orders/<int:order_id>/payment-proof` - Upload payment proof
- `PUT /api/orders/<int:order_id>/cancel` - Cancel order (customer)

**Features:**
- Order number generation (UUID-based)
- Stock validation and deduction
- Cart clearing after order
- Payment method validation (cash_on_delivery, online_payment)

### 5. `routes/admin.py` - Admin Operations
**Lines:** 1455  
**Endpoints:** 16

**Order Management:**
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/<int:order_id>/approve` - Approve order
- `PUT /api/admin/orders/<int:order_id>/decline` - Decline order with reason

**Product Management:**
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/<int:product_id>` - Update product
- `DELETE /api/admin/products/<int:product_id>` - Soft delete product
- `POST /api/admin/products/<int:product_id>/upload-image` - Upload product image ⭐ NEW

**Category Management:**
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/<int:category_id>` - Update category
- `DELETE /api/admin/categories/<int:category_id>` - Delete category

**Reports:**
- `GET /api/admin/reports/sales` - Get sales report data
- `POST /api/admin/reports/sales/generate` - Generate PDF/DOCX report ⭐ NEW

**User Management:**
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/<int:user_id>/reset-password` - Reset password
- `PUT /api/admin/users/<int:user_id>/deactivate` - Deactivate user
- `PUT /api/admin/users/<int:user_id>/activate` - Activate user

## New Features

### 1. Sales Report Generation (PDF/DOCX)

**Endpoint:** `POST /api/admin/reports/sales/generate`

**Request Body:**
```json
{
  "format": "pdf",  // or "docx"
  "period": "daily",  // "daily", "weekly", or "monthly"
  "start_date": "2024-01-01",  // optional
  "end_date": "2024-12-31"  // optional
}
```

**Features:**
- Professional PDF reports using ReportLab
- Word documents using python-docx
- Overall statistics section
- Period-based sales data table
- Top 10 selling products table
- Formatted headers and styling
- Downloadable file response

**PDF Report Contents:**
1. Company header with title
2. Report metadata (period, date range, generation time)
3. Overall statistics table (total orders, revenue, customers, etc.)
4. Sales data by period (up to 20 rows)
5. Top 10 selling products with rankings

**DOCX Report Contents:**
Similar structure to PDF with proper Word document formatting using tables and headings.

### 2. Product Image Upload

**Endpoint:** `POST /api/admin/products/<product_id>/upload-image`

**Request:** multipart/form-data with `image_file` field

**Features:**
- File type validation (png, jpg, jpeg, gif)
- UUID-based unique filenames
- Secure filename handling
- Automatic directory creation
- Database update with image URL
- File cleanup on errors

**Upload Directory:** `backend/static/uploads/products/`

**Response:**
```json
{
  "message": "Image uploaded successfully",
  "image_url": "/static/uploads/products/{uuid}.jpg"
}
```

**File Size Limit:** 16MB (configured in Flask app)

### 3. Static File Serving

**Endpoint:** `GET /static/<path:path>`

Serves uploaded images and other static files from the `backend/static/` directory.

**Example:** `http://localhost:5000/static/uploads/products/abc123.jpg`

## Dependencies Added

### New Requirements
```
reportlab==4.0.7      # PDF generation
python-docx==1.1.0    # DOCX generation
```

### Existing Dependencies
```
Flask==2.3.3
Flask-Login==0.6.2
Flask-Bcrypt==1.0.1
Flask-CORS==4.0.0
mysql-connector-python==8.1.0
python-dotenv==1.0.0
```

## Configuration

### File Upload Settings (in backend.py)
```python
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
app.config['UPLOAD_FOLDER'] = 'static/uploads'
```

### Allowed File Extensions (in admin.py)
```python
allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
```

## Git Changes

### Modified Files
- `.gitignore` - Added rules to exclude uploaded files but keep directory structure
- `backend/backend.py` - Refactored to use blueprints
- `backend/requirements.txt` - Added reportlab and python-docx
- `backend/routes/__init__.py` - Blueprint registration

### New Files
- `backend/routes/products.py`
- `backend/routes/cart.py`
- `backend/routes/orders.py`
- `backend/routes/admin.py`
- `backend/static/uploads/products/.gitkeep`
- `backend/test_refactoring.py`

### Backup Files
- `backend/backend_old.py` - Original monolithic file (for reference)

## Testing

### Validation Script
Run the validation test:
```bash
cd backend
python test_refactoring.py
```

This tests:
- Module imports
- Blueprint existence
- Endpoint counts
- New feature presence
- Directory structure

### Manual Testing
1. Start the backend:
   ```bash
   cd backend
   python backend.py
   ```

2. Test health endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```

3. Test products endpoint:
   ```bash
   curl http://localhost:5000/api/products/categories
   ```

4. Test sales report generation:
   ```bash
   curl -X POST http://localhost:5000/api/admin/reports/sales/generate \
     -H "Content-Type: application/json" \
     -d '{"format": "pdf", "period": "monthly"}' \
     --output report.pdf
   ```

5. Test image upload:
   ```bash
   curl -X POST http://localhost:5000/api/admin/products/1/upload-image \
     -F "image_file=@/path/to/image.jpg"
   ```

## Benefits of Refactoring

### Code Organization
- ✅ Reduced main file from 1733 to 226 lines (87% reduction)
- ✅ Logical separation of concerns
- ✅ Easier to navigate and maintain
- ✅ Better code reusability

### Maintainability
- ✅ Each module has a single responsibility
- ✅ Easier to add new features
- ✅ Simpler debugging
- ✅ Better team collaboration

### Scalability
- ✅ Easy to add new blueprints
- ✅ Can be split into separate microservices later
- ✅ Better for API versioning

### Testing
- ✅ Individual modules can be tested in isolation
- ✅ Easier to mock dependencies
- ✅ Better test coverage

## Migration Notes

### Breaking Changes
None. All existing endpoints maintain the same paths and behavior.

### Backward Compatibility
The refactored backend is 100% backward compatible with existing clients. All endpoint paths and responses remain unchanged.

## Future Improvements

### Potential Enhancements
1. Add authentication middleware for admin routes
2. Implement proper session management for auth endpoints
3. Add rate limiting for API endpoints
4. Implement caching for frequently accessed data
5. Add comprehensive unit tests for each blueprint
6. Add API versioning (e.g., `/api/v1/products`)
7. Implement WebSocket support for real-time updates
8. Add file compression for uploaded images
9. Generate thumbnail images for products
10. Add CSV export for sales reports

### Security Improvements
1. Add JWT token authentication
2. Implement CSRF protection
3. Add input validation middleware
4. Implement proper permission checks
5. Add audit logging for admin actions
6. Sanitize file uploads more thoroughly
7. Add virus scanning for uploaded files

## Conclusion

The backend refactoring successfully:
- ✅ Organized 1733 lines of code into 5 modular files
- ✅ Maintained 100% backward compatibility
- ✅ Added PDF/DOCX sales report generation
- ✅ Implemented product image upload functionality
- ✅ Improved code maintainability and scalability
- ✅ Preserved all existing functionality

The new structure provides a solid foundation for future development and makes the codebase more accessible to new developers.
