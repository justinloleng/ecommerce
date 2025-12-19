#!/usr/bin/env python3
"""
Database initialization script for the e-commerce application.
Creates all tables and a default admin user.
"""

from app import init_database

if __name__ == '__main__':
    init_database()
