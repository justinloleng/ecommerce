# ecommerce

A full-featured e-commerce platform with customer and admin interfaces.

## Features

### Customer Features
- User registration and authentication
- Product browsing with categories and filters
- Shopping cart management
- Order placement and tracking
- Order cancellation for pending orders
- View order history with status-based action buttons
- Decline reason visibility for rejected orders

### Admin Features
- **Order Management**: Approve/decline pending orders with reasons
- **Product Management**: Full CRUD operations for products
- **Category Management**: Create, edit, and delete product categories
- **Inventory Tracking**: Monitor and update stock levels
- **Order Processing Workflow**: Progress orders through fulfillment stages
- **Sales Reports**: Generate daily, weekly, and monthly sales reports with statistics
- **User Management**: Reset passwords, activate/deactivate customer accounts

## How to Run the System

### Prerequisites
- Python 3.7+
- MySQL database
- Modern web browser

### Database Setup

1. Create the MySQL database:
```sql
CREATE DATABASE ecommerce_db;
```

2. Run the database migration to add new features:
```bash
cd backend
python migrate_database.py
```

Or manually run the SQL script:
```bash
mysql -u root -p ecommerce_db < migration_add_decline_reason.sql
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python backend.py
```
*Runs the backend server on port 5000.*

### Frontend

```bash
cd frontend
python -m http.server 8000
```
*Runs a simple HTTP server to serve frontend files on port 8000.*

### Access the Application

- **Customer Interface**: http://localhost:8000/
- **Admin Panel**: http://localhost:8000/admin.html (requires admin account)

## Admin Panel

For detailed information about admin features and usage, see [ADMIN_GUIDE.md](ADMIN_GUIDE.md).

### Creating an Admin User

Set the `is_admin` flag to `1` in the database:
```sql
UPDATE users SET is_admin = 1 WHERE email = 'admin@example.com';
```

## Order Status Flow

```
Customer Places Order → Pending
                          ↓
Admin Approves → Processing → Shipped → In Transit → Delivered
       OR
Admin Declines → Declined (with reason visible to customer)
       OR
Customer Cancels → Cancelled (only for pending orders)
```

## API Endpoints

### Customer Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/products` - Get products with filters
- `POST /api/cart/add` - Add item to cart
- `POST /api/orders` - Create order
- `GET /api/orders/user/:id` - Get user's orders
- `PUT /api/orders/:id/cancel` - Cancel pending order

### Admin Endpoints
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/approve` - Approve order
- `PUT /api/admin/orders/:id/decline` - Decline order with reason
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

### Admin Reports Endpoints
- `GET /api/admin/reports/sales` - Get sales reports (daily/weekly/monthly)

### Admin User Management Endpoints
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/reset-password` - Reset user password
- `PUT /api/admin/users/:id/deactivate` - Deactivate user account
- `PUT /api/admin/users/:id/activate` - Activate user account

For complete API documentation, see the backend logs when starting the server.

---

## Git Workflow

1. **Create a Branch**

   Name your branch based on the type of change:
   - `feat/<short-description>` for new features
   - `fix/<short-description>` for bug fixes
   - `chore/<short-description>` for maintenance or chores

   Example:
   ```bash
   git checkout -b feat/user-auth
   ```

2. **Make Changes & Commit**

   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```

3. **Push Your Branch**

   ```bash
   git push origin feat/user-auth
   ```

4. **Pull Latest Changes Before Merging**

   Always update your branch:
   ```bash
   git pull origin main
   # resolve any conflicts and commit if necessary
   ```

5. **Create a Pull Request**

   Open a PR on GitHub to merge your branch into `main`.

---

## Project Structure

```
ecommerce/
├── backend/
│   ├── backend.py              # Main Flask application
│   ├── models/                 # Database models
│   ├── routes/                 # API routes
│   ├── migrate_database.py     # Database migration script
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── index.html             # Login/Register page
│   ├── dashboard.html         # User dashboard
│   ├── products.html          # Product catalog
│   ├── cart.html              # Shopping cart
│   ├── orders.html            # Order history
│   ├── admin.html             # Admin panel (NEW)
│   └── css/                   # Stylesheets
├── ADMIN_GUIDE.md             # Admin features documentation
└── README.md                  # This file
```

## Recent Updates

### Order Action Buttons Fix
- ✅ "Cancel Order" button now shows only for pending orders
- ✅ "View Detail" button shows for processing/shipped/delivered orders
- ✅ "Track Order" button shows only for shipped/in-transit orders

### Admin Panel Features
- ✅ Complete order management with approve/decline workflow
- ✅ Product CRUD operations with inventory management
- ✅ Category management system
- ✅ Decline reason tracking and customer visibility

Happy coding!

