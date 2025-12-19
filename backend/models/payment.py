from datetime import datetime
from backend.config.database import db

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False, unique=True)
    payment_method = db.Column(db.String(50), nullable=False)  # 'cod' or 'online'
    payment_proof_file = db.Column(db.String(500))  # For online payments
    status = db.Column(db.String(50), default='Pending')  # Pending, Completed, Failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Payment order={self.order_id} method={self.payment_method}>'
