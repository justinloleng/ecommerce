# Quick Start Guide

Get the E-Commerce application running in 5 minutes!

## Option 1: Docker (Recommended - Easiest)

**Prerequisites:** Docker and Docker Compose installed

```bash
# Clone the repository
git clone <repository-url>
cd ecommerce

# Start everything with one command
docker-compose up -d

# Wait about 30 seconds for initialization, then visit:
# http://localhost:5000

# Login credentials:
# Admin: admin / (check docker logs for auto-generated password)
# To view password: docker-compose logs web | grep -A 5 "IMPORTANT"
# (Create customer account via registration)
```

**That's it!** The application is now running with a MySQL database, sample data, and the default admin user.

To stop:
```bash
docker-compose down
```

---

## Option 2: Local Installation (Manual)

**Prerequisites:** Python 3.8+, MySQL Server

### Step 1: Setup Database
```bash
# In MySQL console:
CREATE DATABASE ecommerce_db;
```

### Step 2: Install Application
```bash
# Clone repository
git clone <repository-url>
cd ecommerce

# Run automated setup script
chmod +x setup.sh
./setup.sh

# Configure .env file with your database credentials
nano .env
```

### Step 3: Initialize Database
```bash
# Activate virtual environment
source venv/bin/activate

# Create tables and admin user
python init_db.py

# (Optional) Add sample products
python add_sample_data.py
```

### Step 4: Run Application
```bash
python app.py
```

Visit: http://localhost:5000

---

## First Login

**Admin Account:**
- Username: `admin`
- Password: Auto-generated (displayed in console output from `init_db.py`)
- ⚠️ **Save the password shown during initialization!**
- Set custom password via `ADMIN_PASSWORD` environment variable

**Customer Account:**
- Register a new account at http://localhost:5000/register

---

## Quick Tour

### As Customer:
1. Browse products on home page
2. Search and filter products
3. Add items to cart
4. Proceed to checkout
5. Select payment method (COD or Online)
6. Track order status in "My Orders"

### As Admin:
1. Login with admin credentials
2. Dashboard shows overview
3. Add categories and products
4. Process customer orders
5. View sales reports
6. Manage users

---

## Common Commands

```bash
# Start application
python app.py

# Reset database (WARNING: deletes all data)
python init_db.py

# Add sample products
python add_sample_data.py

# With Docker
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose logs -f web    # View logs
docker-compose down -v        # Reset everything
```

---

## Troubleshooting

### "Can't connect to MySQL server"
- Ensure MySQL is running
- Check credentials in `.env` file
- Verify database exists

### "Port 5000 already in use"
Edit `app.py` and change port:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### "Module not found"
```bash
# Activate virtual environment
source venv/bin/activate
# Reinstall dependencies
pip install -r requirements.txt
```

---

## Next Steps

- Read [README.md](README.md) for detailed documentation
- See [TESTING.md](TESTING.md) for testing guide
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

---

## Security Note

**Before going to production:**
1. Change admin password
2. Generate new SECRET_KEY
3. Set FLASK_ENV=production
4. Use HTTPS
5. Review security checklist in DEPLOYMENT.md

---

## Need Help?

- Check application logs
- Review error messages
- See troubleshooting sections in README.md
- Open an issue on GitHub

---

**Enjoy your E-Commerce application!** 🚀
