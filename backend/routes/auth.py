from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from marshmallow import ValidationError
from backend.config.database import db
from backend.models import User
from backend.utils.validators import RegisterSchema, LoginSchema

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        schema = RegisterSchema()
        try:
            data = schema.load(request.form)
            
            # Check if user already exists
            if User.query.filter_by(username=data['username']).first():
                flash('Username already exists', 'danger')
                return render_template('auth/register.html')
            
            if User.query.filter_by(email=data['email']).first():
                flash('Email already exists', 'danger')
                return render_template('auth/register.html')
            
            # Create new user
            hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
            new_user = User(
                username=data['username'],
                email=data['email'],
                password_hash=hashed_password,
                full_name=data['full_name'],
                phone=data.get('phone'),
                address=data.get('address')
            )
            
            db.session.add(new_user)
            db.session.commit()
            
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('auth.login'))
            
        except ValidationError as err:
            flash(f'Validation error: {err.messages}', 'danger')
            return render_template('auth/register.html')
    
    return render_template('auth/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        schema = LoginSchema()
        try:
            data = schema.load(request.form)
            
            user = User.query.filter_by(username=data['username']).first()
            
            if user and user.is_active and bcrypt.check_password_hash(user.password_hash, data['password']):
                login_user(user, remember=True)
                next_page = request.args.get('next')
                
                if user.role == 'admin':
                    return redirect(next_page) if next_page else redirect(url_for('admin.dashboard'))
                else:
                    return redirect(next_page) if next_page else redirect(url_for('main.index'))
            else:
                flash('Invalid username or password', 'danger')
                
        except ValidationError as err:
            flash(f'Validation error: {err.messages}', 'danger')
    
    return render_template('auth/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('main.index'))
