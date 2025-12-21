from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models.user import User
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        # Get JSON data
        data = request.get_json()
        print(f"📝 Registration data: {data}")
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        if not User.validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check username availability
        if User.get_by_username(data['username']):
            return jsonify({'error': 'Username already exists'}), 400
        
        # Check email availability
        if User.get_by_email(data['email']):
            return jsonify({'error': 'Email already registered'}), 400
        
        # Check password strength
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        print(f"🔧 Creating user: {data['username']}")
        
        # Create new user
        user = User.create(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            address=data.get('address'),
            phone=data.get('phone')
        )
        
        if not user:
            print(" User creation returned None")
            return jsonify({'error': 'Failed to create user in database'}), 500
        
        print(f"✅ User created: {user.id}")
        
        login_user(user, remember=True)
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        print(f" Registration error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()

        if 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400
        
   
        user = User.get_by_email(data['email'])

        if not user or not user.verify_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
     
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated. Contact admin.'}), 403
        
    
        login_user(user, remember=data.get('remember', False))
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Logout user"""
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current user info"""
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/check-username/<username>', methods=['GET'])
def check_username(username):
    """Check if username is available"""
    user = User.get_by_username(username)
    return jsonify({'available': user is None}), 200

@auth_bp.route('/check-email/<email>', methods=['GET'])
def check_email(email):
    """Check if email is available"""
    user = User.get_by_email(email)
    return jsonify({'available': user is None}), 200