from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from marshmallow import ValidationError
import os
from backend.config.database import db
from backend.models import Product, CartItem, Order, OrderItem, Payment
from backend.utils.validators import CartItemSchema, CheckoutSchema

customer_bp = Blueprint('customer', __name__, url_prefix='/customer')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg'}

@customer_bp.route('/cart')
@login_required
def cart():
    cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
    total = sum(item.product.price * item.quantity for item in cart_items if item.product)
    return render_template('customer/cart.html', cart_items=cart_items, total=total)

@customer_bp.route('/cart/add', methods=['POST'])
@login_required
def add_to_cart():
    schema = CartItemSchema()
    try:
        data = schema.load(request.form)
        
        product = Product.query.get_or_404(data['product_id'])
        
        # Check if product is in stock
        if product.stock_quantity < data['quantity']:
            flash('Not enough stock available', 'danger')
            return redirect(url_for('main.product_detail', product_id=product.id))
        
        # Check if item already in cart
        cart_item = CartItem.query.filter_by(
            user_id=current_user.id,
            product_id=data['product_id']
        ).first()
        
        if cart_item:
            cart_item.quantity += data['quantity']
        else:
            cart_item = CartItem(
                user_id=current_user.id,
                product_id=data['product_id'],
                quantity=data['quantity']
            )
            db.session.add(cart_item)
        
        db.session.commit()
        flash('Product added to cart', 'success')
        return redirect(url_for('customer.cart'))
        
    except ValidationError as err:
        flash(f'Validation error: {err.messages}', 'danger')
        return redirect(url_for('main.index'))

@customer_bp.route('/cart/update/<int:item_id>', methods=['POST'])
@login_required
def update_cart(item_id):
    cart_item = CartItem.query.get_or_404(item_id)
    
    if cart_item.user_id != current_user.id:
        flash('Unauthorized', 'danger')
        return redirect(url_for('customer.cart'))
    
    quantity = request.form.get('quantity', type=int)
    
    if quantity and quantity > 0:
        if cart_item.product.stock_quantity >= quantity:
            cart_item.quantity = quantity
            db.session.commit()
            flash('Cart updated', 'success')
        else:
            flash('Not enough stock available', 'danger')
    else:
        flash('Invalid quantity', 'danger')
    
    return redirect(url_for('customer.cart'))

@customer_bp.route('/cart/remove/<int:item_id>', methods=['POST'])
@login_required
def remove_from_cart(item_id):
    cart_item = CartItem.query.get_or_404(item_id)
    
    if cart_item.user_id != current_user.id:
        flash('Unauthorized', 'danger')
        return redirect(url_for('customer.cart'))
    
    db.session.delete(cart_item)
    db.session.commit()
    flash('Item removed from cart', 'success')
    return redirect(url_for('customer.cart'))

@customer_bp.route('/checkout', methods=['GET', 'POST'])
@login_required
def checkout():
    cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
    
    if not cart_items:
        flash('Your cart is empty', 'warning')
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        schema = CheckoutSchema()
        try:
            data = schema.load(request.form)
            
            # Calculate total
            total = sum(item.product.price * item.quantity for item in cart_items)
            
            # Create order
            order = Order(
                user_id=current_user.id,
                total_amount=total,
                shipping_address=data['shipping_address'],
                phone=data['phone'],
                status='Pending'
            )
            db.session.add(order)
            db.session.flush()  # Get order ID
            
            # Create order items and update stock
            for cart_item in cart_items:
                if cart_item.product.stock_quantity < cart_item.quantity:
                    db.session.rollback()
                    flash(f'Not enough stock for {cart_item.product.name}', 'danger')
                    return redirect(url_for('customer.cart'))
                
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=cart_item.product_id,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price
                )
                db.session.add(order_item)
                
                # Update stock
                cart_item.product.stock_quantity -= cart_item.quantity
            
            # Handle payment
            payment = Payment(
                order_id=order.id,
                payment_method=data['payment_method']
            )
            
            # Handle file upload for online payment
            if data['payment_method'] == 'online':
                if 'payment_proof' not in request.files:
                    db.session.rollback()
                    flash('Payment proof is required for online payment', 'danger')
                    return redirect(url_for('customer.checkout'))
                
                file = request.files['payment_proof']
                if file.filename == '':
                    db.session.rollback()
                    flash('No file selected', 'danger')
                    return redirect(url_for('customer.checkout'))
                
                if file and allowed_file(file.filename):
                    filename = secure_filename(f"payment_{order.id}_{file.filename}")
                    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                    payment.payment_proof_file = filename
                else:
                    db.session.rollback()
                    flash('Invalid file type. Only PNG, JPG, JPEG allowed', 'danger')
                    return redirect(url_for('customer.checkout'))
            
            db.session.add(payment)
            
            # Clear cart
            for cart_item in cart_items:
                db.session.delete(cart_item)
            
            db.session.commit()
            flash('Order placed successfully!', 'success')
            return redirect(url_for('customer.orders'))
            
        except ValidationError as err:
            flash(f'Validation error: {err.messages}', 'danger')
    
    total = sum(item.product.price * item.quantity for item in cart_items)
    return render_template('customer/checkout.html', cart_items=cart_items, total=total)

@customer_bp.route('/orders')
@login_required
def orders():
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return render_template('customer/orders.html', orders=orders)

@customer_bp.route('/order/<int:order_id>')
@login_required
def order_detail(order_id):
    order = Order.query.get_or_404(order_id)
    
    if order.user_id != current_user.id:
        flash('Unauthorized', 'danger')
        return redirect(url_for('customer.orders'))
    
    return render_template('customer/order_detail.html', order=order)
