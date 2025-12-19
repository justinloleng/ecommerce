from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from flask_bcrypt import Bcrypt
from functools import wraps
from marshmallow import ValidationError
from datetime import datetime, timedelta
from sqlalchemy import func
from backend.config.database import db
from backend.models import Product, Category, Order, OrderItem, User, Payment
from backend.utils.validators import ProductSchema, CategorySchema, OrderStatusSchema

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')
bcrypt = Bcrypt()

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            flash('Admin access required', 'danger')
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/dashboard')
@login_required
@admin_required
def dashboard():
    total_products = Product.query.count()
    total_orders = Order.query.count()
    pending_orders = Order.query.filter_by(status='Pending').count()
    total_users = User.query.filter_by(role='customer').count()
    
    # Recent orders
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()
    
    return render_template('admin/dashboard.html',
                         total_products=total_products,
                         total_orders=total_orders,
                         pending_orders=pending_orders,
                         total_users=total_users,
                         recent_orders=recent_orders)

# Product Management
@admin_bp.route('/products')
@login_required
@admin_required
def products():
    products = Product.query.order_by(Product.created_at.desc()).all()
    return render_template('admin/products.html', products=products)

@admin_bp.route('/products/add', methods=['GET', 'POST'])
@login_required
@admin_required
def add_product():
    if request.method == 'POST':
        schema = ProductSchema()
        try:
            data = schema.load(request.form)
            
            product = Product(
                name=data['name'],
                description=data.get('description'),
                price=data['price'],
                stock_quantity=data.get('stock_quantity', 0),
                category_id=data['category_id'],
                image_url=data.get('image_url')
            )
            
            db.session.add(product)
            db.session.commit()
            flash('Product added successfully', 'success')
            return redirect(url_for('admin.products'))
            
        except ValidationError as err:
            flash(f'Validation error: {err.messages}', 'danger')
    
    categories = Category.query.all()
    return render_template('admin/product_form.html', categories=categories)

@admin_bp.route('/products/edit/<int:product_id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_product(product_id):
    product = Product.query.get_or_404(product_id)
    
    if request.method == 'POST':
        schema = ProductSchema()
        try:
            data = schema.load(request.form)
            
            product.name = data['name']
            product.description = data.get('description')
            product.price = data['price']
            product.stock_quantity = data.get('stock_quantity', 0)
            product.category_id = data['category_id']
            product.image_url = data.get('image_url')
            
            db.session.commit()
            flash('Product updated successfully', 'success')
            return redirect(url_for('admin.products'))
            
        except ValidationError as err:
            flash(f'Validation error: {err.messages}', 'danger')
    
    categories = Category.query.all()
    return render_template('admin/product_form.html', product=product, categories=categories)

@admin_bp.route('/products/delete/<int:product_id>', methods=['POST'])
@login_required
@admin_required
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    
    # Soft delete by deactivating
    product.is_active = False
    db.session.commit()
    flash('Product deleted successfully', 'success')
    return redirect(url_for('admin.products'))

# Category Management
@admin_bp.route('/categories')
@login_required
@admin_required
def categories():
    categories = Category.query.order_by(Category.created_at.desc()).all()
    return render_template('admin/categories.html', categories=categories)

@admin_bp.route('/categories/add', methods=['GET', 'POST'])
@login_required
@admin_required
def add_category():
    if request.method == 'POST':
        schema = CategorySchema()
        try:
            data = schema.load(request.form)
            
            # Check if category exists
            if Category.query.filter_by(name=data['name']).first():
                flash('Category already exists', 'danger')
                return render_template('admin/category_form.html')
            
            category = Category(
                name=data['name'],
                description=data.get('description')
            )
            
            db.session.add(category)
            db.session.commit()
            flash('Category added successfully', 'success')
            return redirect(url_for('admin.categories'))
            
        except ValidationError as err:
            flash(f'Validation error: {err.messages}', 'danger')
    
    return render_template('admin/category_form.html')

@admin_bp.route('/categories/edit/<int:category_id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_category(category_id):
    category = Category.query.get_or_404(category_id)
    
    if request.method == 'POST':
        schema = CategorySchema()
        try:
            data = schema.load(request.form)
            
            # Check if another category with same name exists
            existing = Category.query.filter_by(name=data['name']).first()
            if existing and existing.id != category_id:
                flash('Category name already exists', 'danger')
                return render_template('admin/category_form.html', category=category)
            
            category.name = data['name']
            category.description = data.get('description')
            
            db.session.commit()
            flash('Category updated successfully', 'success')
            return redirect(url_for('admin.categories'))
            
        except ValidationError as err:
            flash(f'Validation error: {err.messages}', 'danger')
    
    return render_template('admin/category_form.html', category=category)

@admin_bp.route('/categories/delete/<int:category_id>', methods=['POST'])
@login_required
@admin_required
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    
    # Check if category has products
    if category.products:
        flash('Cannot delete category with products', 'danger')
        return redirect(url_for('admin.categories'))
    
    db.session.delete(category)
    db.session.commit()
    flash('Category deleted successfully', 'success')
    return redirect(url_for('admin.categories'))

# Order Management
@admin_bp.route('/orders')
@login_required
@admin_required
def orders():
    status = request.args.get('status', '')
    
    query = Order.query
    if status:
        query = query.filter_by(status=status)
    
    orders = query.order_by(Order.created_at.desc()).all()
    return render_template('admin/orders.html', orders=orders, current_status=status)

@admin_bp.route('/orders/<int:order_id>')
@login_required
@admin_required
def order_detail(order_id):
    order = Order.query.get_or_404(order_id)
    return render_template('admin/order_detail.html', order=order)

@admin_bp.route('/orders/<int:order_id>/update', methods=['POST'])
@login_required
@admin_required
def update_order_status(order_id):
    order = Order.query.get_or_404(order_id)
    schema = OrderStatusSchema()
    
    try:
        data = schema.load(request.form)
        
        order.status = data['status']
        
        if data['status'] == 'Declined':
            if not data.get('decline_reason'):
                flash('Decline reason is required', 'danger')
                return redirect(url_for('admin.order_detail', order_id=order_id))
            order.decline_reason = data.get('decline_reason')
            
            # Restore stock for declined orders
            for item in order.order_items:
                item.product.stock_quantity += item.quantity
        
        db.session.commit()
        flash('Order status updated successfully', 'success')
        
    except ValidationError as err:
        flash(f'Validation error: {err.messages}', 'danger')
    
    return redirect(url_for('admin.order_detail', order_id=order_id))

# User Management
@admin_bp.route('/users')
@login_required
@admin_required
def users():
    users = User.query.filter_by(role='customer').order_by(User.created_at.desc()).all()
    return render_template('admin/users.html', users=users)

@admin_bp.route('/users/<int:user_id>/toggle', methods=['POST'])
@login_required
@admin_required
def toggle_user_status(user_id):
    user = User.query.get_or_404(user_id)
    
    if user.role == 'admin':
        flash('Cannot modify admin accounts', 'danger')
        return redirect(url_for('admin.users'))
    
    user.is_active = not user.is_active
    db.session.commit()
    
    status = 'activated' if user.is_active else 'deactivated'
    flash(f'User {status} successfully', 'success')
    return redirect(url_for('admin.users'))

@admin_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@login_required
@admin_required
def reset_password(user_id):
    user = User.query.get_or_404(user_id)
    
    if user.role == 'admin':
        flash('Cannot modify admin accounts', 'danger')
        return redirect(url_for('admin.users'))
    
    new_password = request.form.get('new_password')
    
    if not new_password or len(new_password) < 6:
        flash('Password must be at least 6 characters', 'danger')
        return redirect(url_for('admin.users'))
    
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.session.commit()
    flash('Password reset successfully', 'success')
    return redirect(url_for('admin.users'))

# Sales Reports
@admin_bp.route('/reports')
@login_required
@admin_required
def reports():
    period = request.args.get('period', 'daily')
    
    today = datetime.now().date()
    
    if period == 'daily':
        start_date = today
        end_date = today + timedelta(days=1)
        title = f'Daily Sales Report - {today.strftime("%Y-%m-%d")}'
    elif period == 'weekly':
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=7)
        title = f'Weekly Sales Report - Week of {start_date.strftime("%Y-%m-%d")}'
    elif period == 'monthly':
        start_date = today.replace(day=1)
        if today.month == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1)
        else:
            end_date = today.replace(month=today.month + 1, day=1)
        title = f'Monthly Sales Report - {today.strftime("%B %Y")}'
    else:
        start_date = today - timedelta(days=30)
        end_date = today + timedelta(days=1)
        title = 'Sales Report'
    
    # Get orders in date range
    orders = Order.query.filter(
        Order.created_at >= start_date,
        Order.created_at < end_date,
        Order.status.in_(['Approved', 'Shipped', 'Delivered'])
    ).all()
    
    total_sales = sum(float(order.total_amount) for order in orders)
    total_orders = len(orders)
    
    # Product sales
    product_sales = db.session.query(
        Product.name,
        func.sum(OrderItem.quantity).label('total_quantity'),
        func.sum(OrderItem.quantity * OrderItem.price).label('total_revenue')
    ).join(OrderItem).join(Order).filter(
        Order.created_at >= start_date,
        Order.created_at < end_date,
        Order.status.in_(['Approved', 'Shipped', 'Delivered'])
    ).group_by(Product.id).all()
    
    return render_template('admin/reports.html',
                         title=title,
                         period=period,
                         orders=orders,
                         total_sales=total_sales,
                         total_orders=total_orders,
                         product_sales=product_sales)
