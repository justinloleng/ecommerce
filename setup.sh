#!/bin/bash

# E-Commerce Application Setup Script
# This script helps set up the application quickly

set -e

echo "=================================="
echo "E-Commerce Application Setup"
echo "=================================="
echo ""

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.8"

if (( $(echo "$python_version < $required_version" | bc -l) )); then
    echo "Error: Python 3.8 or higher is required. Found: Python $python_version"
    exit 1
fi

echo "✓ Python version: $(python3 --version)"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo ""
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Dependencies installed"

# Setup .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your database credentials!"
    echo "   Database configuration required:"
    echo "   - DATABASE_HOST"
    echo "   - DATABASE_USER"
    echo "   - DATABASE_PASSWORD"
    echo "   - DATABASE_NAME"
    echo "   - SECRET_KEY (change in production!)"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Create MySQL database: CREATE DATABASE ecommerce_db;"
echo "3. Initialize database: python init_db.py"
echo "4. Run the application: python app.py"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo "  ⚠️  Change this password after first login!"
echo ""
