# E-Commerce Application

A full-stack e-commerce web application built with Flask and MySQL, featuring customer and admin functionality.

## Features

### Customer Features
- **User Authentication**: Secure registration and login with bcrypt password hashing
- **Product Catalog**: Browse and search products with advanced filtering (category, price range, search)
- **Shopping Cart**: Add, update, and remove items from cart
- **Checkout Process**: Complete orders with shipping information
- **Payment Methods**: 
  - Cash on Delivery (COD)
  - Online Payment (with screenshot upload as proof)
- **Order Tracking**: View order history and track order status (Pending, Approved, Shipped, Delivered, Declined)

### Admin Features
- **Product Management**: Full CRUD operations for products
- **Category Management**: Organize products into categories
- **Inventory Tracking**: Monitor and update stock quantities
- **Order Processing**: 
  - View all orders with filtering by status
  - Approve or decline orders
  - Provide decline reasons
  - Update order status
- **User Management**: 
  - View all customer accounts
  - Activate/deactivate user accounts
  - Reset customer passwords
- **Sales Reports**: Generate daily, weekly, and monthly sales reports

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: MySQL with PyMySQL driver
- **ORM**: SQLAlchemy
- **Authentication**: Flask-Login with Bcrypt password hashing
- **Validation**: Marshmallow schemas
- **Frontend**: Bootstrap 5, HTML5, CSS3, JavaScript
- **Icons**: Font Awesome

## Project Structure

```
ecommerce/
├── backend/
│   ├── config/
│   │   └── database.py          # Database configuration
│   ├── models/                   # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── category.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   └── payment.py
│   ├── routes/                   # Flask blueprints
│   │   ├── __init__.py
│   │   ├── auth.py              # Authentication routes
│   │   ├── main.py              # Public routes
│   │   ├── customer.py          # Customer routes
│   │   └── admin.py             # Admin routes
│   └── utils/
│       └── validators.py         # Marshmallow validation schemas
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── js/
│   │   │   └── script.js
│   │   └── uploads/
│   │       └── payments/         # Payment proof uploads
│   └── templates/                # Jinja2 templates
│       ├── base.html
│       ├── auth/                 # Authentication templates
│       ├── main/                 # Public templates
│       ├── customer/             # Customer templates
│       └── admin/                # Admin templates
├── app.py                        # Application entry point
├── init_db.py                    # Database initialization script
├── requirements.txt              # Python dependencies
├── .env.example                  # Example environment variables
└── README.md

```

## Installation & Setup

### Prerequisites
- Python 3.8+
- MySQL Server 5.7+ or 8.0+
- pip (Python package manager)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd ecommerce
```

### Step 2: Set Up Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure MySQL Database

1. Create a MySQL database:
```sql
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Create a MySQL user (optional but recommended):
```sql
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 5: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and update with your database credentials:
```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here-change-this-in-production
DATABASE_HOST=localhost
DATABASE_USER=ecommerce_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=ecommerce_db
```

### Step 6: Initialize Database

Run the database initialization script to create tables and default admin user:
```bash
python init_db.py
```

This creates:
- All required database tables
- Default admin account:
  - Username: `admin`
  - Password: `admin123`
  - **⚠️ Change this password immediately after first login!**

### Step 7: Run the Application

```bash
python app.py
```

The application will be available at: `http://localhost:5000`

## Usage

### First-Time Setup

1. **Access the application**: Open `http://localhost:5000` in your browser

2. **Login as admin**: 
   - Go to login page
   - Username: `admin`
   - Password: `admin123`
   - **Important**: Change the admin password after first login

3. **Set up categories**:
   - Navigate to Admin Dashboard → Manage Categories
   - Add product categories (e.g., Electronics, Clothing, Books)

4. **Add products**:
   - Navigate to Admin Dashboard → Manage Products
   - Add products with details, prices, and stock quantities

5. **Create customer account**:
   - Logout from admin
   - Register a new customer account
   - Test the customer features

### Customer Workflow

1. **Browse Products**: View product catalog with search and filters
2. **Add to Cart**: Select products and add to shopping cart
3. **Checkout**: Provide shipping information and select payment method
4. **Track Orders**: Monitor order status in "My Orders" section

### Admin Workflow

1. **Process Orders**: Review pending orders and approve/decline
2. **Manage Inventory**: Update stock quantities and product information
3. **View Reports**: Generate sales reports (daily/weekly/monthly)
4. **Manage Users**: Activate/deactivate accounts, reset passwords

## Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **Input Validation**: Marshmallow schemas validate all user inputs
- **CSRF Protection**: Flask-WTF provides CSRF protection
- **Session Management**: Secure session handling with Flask-Login
- **SQL Injection Prevention**: SQLAlchemy ORM parameterized queries
- **File Upload Security**: Restricted file types and secure filename handling

## API Routes

### Authentication
- `GET/POST /register` - User registration
- `GET/POST /login` - User login
- `GET /logout` - User logout

### Public Routes
- `GET /` - Product catalog with search/filter
- `GET /product/<id>` - Product details

### Customer Routes (Login Required)
- `GET /customer/cart` - View shopping cart
- `POST /customer/cart/add` - Add item to cart
- `POST /customer/cart/update/<id>` - Update cart item
- `POST /customer/cart/remove/<id>` - Remove from cart
- `GET/POST /customer/checkout` - Checkout process
- `GET /customer/orders` - View order history
- `GET /customer/order/<id>` - Order details

### Admin Routes (Admin Role Required)
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/products` - Manage products
- `GET/POST /admin/products/add` - Add product
- `GET/POST /admin/products/edit/<id>` - Edit product
- `POST /admin/products/delete/<id>` - Delete product
- `GET /admin/categories` - Manage categories
- `GET/POST /admin/categories/add` - Add category
- `GET/POST /admin/categories/edit/<id>` - Edit category
- `POST /admin/categories/delete/<id>` - Delete category
- `GET /admin/orders` - View all orders
- `GET /admin/orders/<id>` - Order details
- `POST /admin/orders/<id>/update` - Update order status
- `GET /admin/users` - Manage users
- `POST /admin/users/<id>/toggle` - Activate/deactivate user
- `POST /admin/users/<id>/reset-password` - Reset password
- `GET /admin/reports` - Sales reports

## Database Schema

### Users Table
- id, username, email, password_hash, full_name, phone, address
- role (customer/admin), is_active, created_at, updated_at

### Products Table
- id, name, description, price, stock_quantity, category_id
- image_url, is_active, created_at, updated_at

### Categories Table
- id, name, description, created_at, updated_at

### Orders Table
- id, user_id, total_amount, status, decline_reason
- shipping_address, phone, created_at, updated_at

### Order Items Table
- id, order_id, product_id, quantity, price, created_at

### Payments Table
- id, order_id, payment_method, payment_proof_file
- status, created_at, updated_at

### Cart Items Table
- id, user_id, product_id, quantity, created_at, updated_at

## Development

### Running in Development Mode
```bash
export FLASK_ENV=development  # On Windows: set FLASK_ENV=development
python app.py
```

### Database Migrations
To reset the database:
```bash
python init_db.py
```

## Production Deployment

### Important Security Considerations

1. **Change default admin password**
2. **Use strong SECRET_KEY** (generate with: `python -c "import secrets; print(secrets.token_hex(32))"`)
3. **Set FLASK_ENV=production**
4. **Use a production WSGI server** (e.g., Gunicorn, uWSGI)
5. **Enable HTTPS**
6. **Configure firewall rules**
7. **Regular database backups**
8. **Update dependencies regularly**

### Example Production Setup with Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## Troubleshooting

### Database Connection Errors
- Verify MySQL is running: `systemctl status mysql` (Linux) or check Services (Windows)
- Check credentials in `.env` file
- Ensure database exists: `SHOW DATABASES;` in MySQL

### Import Errors
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Permission Errors for Uploads
```bash
mkdir -p frontend/static/uploads/payments
chmod 755 frontend/static/uploads/payments
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue in the GitHub repository.