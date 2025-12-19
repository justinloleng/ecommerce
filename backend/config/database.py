import os
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()

def init_db(app):
    """Initialize database configuration"""
    db_host = os.getenv('DATABASE_HOST', 'localhost')
    db_user = os.getenv('DATABASE_USER', 'root')
    db_password = os.getenv('DATABASE_PASSWORD', '')
    db_name = os.getenv('DATABASE_NAME', 'ecommerce_db')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Require SECRET_KEY in production
    secret_key = os.getenv('SECRET_KEY')
    if not secret_key:
        if os.getenv('FLASK_ENV') == 'production':
            raise ValueError("SECRET_KEY environment variable must be set in production")
        import secrets
        secret_key = secrets.token_hex(32)
        print(f"WARNING: Using auto-generated SECRET_KEY. Set SECRET_KEY environment variable for production.")
    app.config['SECRET_KEY'] = secret_key
    
    # Upload folder configuration
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'frontend', 'static', 'uploads', 'payments')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    
    db.init_app(app)
    
    return db
