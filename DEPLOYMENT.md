# Deployment Guide

This guide covers different deployment options for the E-Commerce application.

## Table of Contents
1. [Docker Deployment](#docker-deployment)
2. [Traditional Server Deployment](#traditional-server-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Production Checklist](#production-checklist)

---

## Docker Deployment

### Prerequisites
- Docker installed
- Docker Compose installed

### Quick Start with Docker

1. **Clone the repository:**
```bash
git clone <repository-url>
cd ecommerce
```

2. **Start the application:**
```bash
docker-compose up -d
```

This will:
- Start MySQL database
- Build and start the Flask application
- Initialize the database with default admin user
- Add sample data
- Expose the app on http://localhost:5000

3. **Access the application:**
- Open browser to http://localhost:5000
- Login as admin: username `admin`, password `admin123`

4. **View logs:**
```bash
docker-compose logs -f web
```

5. **Stop the application:**
```bash
docker-compose down
```

6. **Reset everything (including database):**
```bash
docker-compose down -v
docker-compose up -d
```

### Production Docker Setup

For production, modify `docker-compose.yml`:

1. Change MySQL passwords
2. Set `FLASK_ENV=production`
3. Generate strong `SECRET_KEY`
4. Use volume mounts for persistent uploads
5. Add reverse proxy (nginx)

---

## Traditional Server Deployment

### Ubuntu/Debian Server Setup

#### 1. Install System Dependencies

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv mysql-server nginx -y
```

#### 2. Configure MySQL

```bash
sudo mysql_secure_installation
sudo mysql -u root -p
```

In MySQL console:
```sql
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ecommerce_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecommerce_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Set Up Application

```bash
# Create application directory
sudo mkdir -p /var/www/ecommerce
sudo chown $USER:$USER /var/www/ecommerce
cd /var/www/ecommerce

# Clone repository
git clone <repository-url> .

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn  # Production WSGI server
```

#### 4. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update `.env` with production values:
```env
FLASK_ENV=production
SECRET_KEY=<generate-strong-key>
DATABASE_HOST=localhost
DATABASE_USER=ecommerce_user
DATABASE_PASSWORD=<your-strong-password>
DATABASE_NAME=ecommerce_db
```

Generate secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

#### 5. Initialize Database

```bash
source venv/bin/activate
python init_db.py
python add_sample_data.py  # Optional
```

#### 6. Create Systemd Service

```bash
sudo nano /etc/systemd/system/ecommerce.service
```

Add:
```ini
[Unit]
Description=E-Commerce Flask Application
After=network.target mysql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ecommerce
Environment="PATH=/var/www/ecommerce/venv/bin"
ExecStart=/var/www/ecommerce/venv/bin/gunicorn --workers 4 --bind unix:ecommerce.sock -m 007 app:app

[Install]
WantedBy=multi-user.target
```

#### 7. Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/ecommerce
sudo chmod -R 755 /var/www/ecommerce
sudo mkdir -p /var/www/ecommerce/frontend/static/uploads/payments
sudo chown -R www-data:www-data /var/www/ecommerce/frontend/static/uploads
```

#### 8. Start Service

```bash
sudo systemctl start ecommerce
sudo systemctl enable ecommerce
sudo systemctl status ecommerce
```

#### 9. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/ecommerce
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        include proxy_params;
        proxy_pass http://unix:/var/www/ecommerce/ecommerce.sock;
    }

    location /static {
        alias /var/www/ecommerce/frontend/static;
        expires 30d;
    }

    client_max_body_size 16M;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

#### 10. Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Cloud Deployment

### AWS EC2 Deployment

1. **Launch EC2 Instance:**
   - Choose Ubuntu 22.04 LTS
   - Select t2.micro or larger
   - Configure security group (allow HTTP, HTTPS, SSH)

2. **Connect and follow Traditional Server Setup**

3. **Set up RDS for MySQL (optional but recommended):**
   - Create MySQL RDS instance
   - Update `.env` with RDS endpoint
   - Configure security groups

4. **Set up SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Heroku Deployment

1. **Install Heroku CLI**

2. **Create `Procfile`:**
```
web: gunicorn app:app
```

3. **Create `runtime.txt`:**
```
python-3.11.5
```

4. **Add JawsDB MySQL addon:**
```bash
heroku addons:create jawsdb:kitefin
```

5. **Deploy:**
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku run python init_db.py
```

### DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Configure build settings:**
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `gunicorn app:app`
3. **Add MySQL database**
4. **Set environment variables**
5. **Deploy**

---

## Production Checklist

### Security

- [ ] Change default admin password
- [ ] Generate strong SECRET_KEY
- [ ] Set FLASK_ENV=production
- [ ] Use HTTPS (SSL certificate)
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set secure session cookies
- [ ] Disable debug mode
- [ ] Configure CORS if needed
- [ ] Regular security updates

### Database

- [ ] Use strong database password
- [ ] Enable MySQL binary logging
- [ ] Set up automated backups
- [ ] Configure database connection pooling
- [ ] Optimize indexes
- [ ] Monitor slow queries

### Application

- [ ] Use production WSGI server (Gunicorn, uWSGI)
- [ ] Configure proper logging
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure log rotation
- [ ] Set up health check endpoint
- [ ] Optimize static file serving
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (CPU, memory, disk)

### Backup Strategy

- [ ] Database backups (daily)
- [ ] Uploaded files backups
- [ ] Configuration files backups
- [ ] Test restore procedures

### Monitoring

- [ ] Application logs
- [ ] Database logs
- [ ] Server metrics
- [ ] Uptime monitoring
- [ ] Error tracking
- [ ] Performance monitoring

### Maintenance

```bash
# View application logs
sudo journalctl -u ecommerce -n 100 -f

# Restart application
sudo systemctl restart ecommerce

# Database backup
mysqldump -u ecommerce_user -p ecommerce_db > backup_$(date +%Y%m%d).sql

# Update application
cd /var/www/ecommerce
git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart ecommerce
```

---

## Troubleshooting

### Application won't start
```bash
# Check logs
sudo journalctl -u ecommerce -n 50

# Check permissions
ls -la /var/www/ecommerce

# Test manually
cd /var/www/ecommerce
source venv/bin/activate
python app.py
```

### Database connection errors
```bash
# Test MySQL connection
mysql -u ecommerce_user -p -h localhost ecommerce_db

# Check MySQL status
sudo systemctl status mysql
```

### Nginx errors
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Scaling

### Horizontal Scaling
- Deploy multiple application instances
- Use load balancer (nginx, HAProxy)
- Share session storage (Redis)
- Use external file storage (S3)

### Database Scaling
- MySQL replication (master-slave)
- Read replicas for queries
- Database connection pooling
- Query optimization

### Caching
- Implement Redis for session storage
- Cache frequently accessed data
- Use CDN for static assets
- Implement query result caching

---

## Support

For deployment issues:
1. Check application logs
2. Check server logs
3. Verify database connectivity
4. Check file permissions
5. Review security group/firewall rules
