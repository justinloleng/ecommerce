import os
from flask import Flask
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from backend.config.database import init_db, db
from backend.models import User
from backend.routes import auth_bp, main_bp, customer_bp, admin_bp

def create_app():
    app = Flask(__name__, 
                template_folder='frontend/templates',
                static_folder='frontend/static')
    
    # Initialize database
    init_db(app)
    
    # Initialize Bcrypt
    bcrypt = Bcrypt(app)
    
    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(admin_bp)
    
    return app

def init_database():
    """Initialize database tables"""
    app = create_app()
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
        
        # Create default admin user if not exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            from flask_bcrypt import Bcrypt
            bcrypt = Bcrypt()
            hashed_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
            admin = User(
                username='admin',
                email='admin@ecommerce.com',
                password_hash=hashed_password,
                full_name='System Administrator',
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created (username: admin, password: admin123)")

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
