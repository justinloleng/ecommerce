// Orders Management
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the orders page
    if (document.querySelector('.orders-container')) {
        loadOrders();
    }
});

async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('http://localhost:3000/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load orders');
        }

        const orders = await response.json();
        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Failed to load orders', 'error');
    }
}

function displayOrders(orders) {
    const ordersContainer = document.querySelector('.orders-list');
    
    if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet.</p>
                <a href="/shop.html" class="btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }

    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.id}</h3>
                    <span class="order-date">${new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <span class="order-status status-${order.status.toLowerCase()}">
                    ${order.status}
                </span>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image_url}" alt="${item.name}">
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            <p class="item-quantity">Quantity: ${item.quantity}</p>
                        </div>
                        <div class="item-price">
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="order-shipping">
                <h4><i class="fas fa-shipping-fast"></i> Shipping Address</h4>
                <p>${order.shipping_address}</p>
            </div>

            <div class="order-footer">
                <div class="order-total">
                    <span>Total:</span>
                    <span class="total-amount">$${order.total.toFixed(2)}</span>
                </div>
                ${order.status.toLowerCase() === 'pending' ? `
                    <div class="order-actions">
                        <button class="btn-cancel" onclick="cancelOrder(${order.id})">
                            <i class="fas fa-times-circle"></i> Cancel Order
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to cancel order');
        }

        showNotification('Order cancelled successfully', 'success');
        loadOrders(); // Reload orders to reflect the change
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification('Failed to cancel order', 'error');
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}