// Orders Management
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize orders page
    loadOrders();
    
    // Set up filter listeners
    document.getElementById('statusFilter').addEventListener('change', loadOrders);
    document.getElementById('dateFilter').addEventListener('change', loadOrders);
});

async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        let url = '/api/orders';
        const params = new URLSearchParams();
        
        if (statusFilter !== 'all') {
            params.append('status', statusFilter);
        }
        
        if (dateFilter !== 'all') {
            params.append('date', dateFilter);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url, {
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
    const ordersContainer = document.getElementById('ordersContainer');
    
    if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>No Orders Found</h3>
                <p>You haven't placed any orders yet.</p>
                <a href="products.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }
    
    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.id}</h3>
                    <span class="order-date">${formatDate(order.created_at)}</span>
                </div>
                <span class="order-status status-${order.status.toLowerCase()}">
                    ${order.status}
                </span>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.product.image}" alt="${item.product.name}">
                        <div class="item-info">
                            <h4>${item.product.name}</h4>
                            <p class="item-quantity">Quantity: ${item.quantity}</p>
                        </div>
                        <div class="item-price">
                            $${(item.price * item.quantity).toFixed(2)}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div class="order-total">
                    <span>Total:</span>
                    <span class="total-amount">$${order.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function getStatusClass(status) {
    const statusMap = {
        'pending': 'warning',
        'processing': 'info',
        'shipped': 'primary',
        'delivered': 'success',
        'cancelled': 'danger'
    };
    return statusMap[status.toLowerCase()] || 'secondary';
}

async function viewOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load order details');
        }
        
        const order = await response.json();
        displayOrderDetails(order);
        
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Failed to load order details', 'error');
    }
}

function displayOrderDetails(order) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content order-details-modal">
            <span class="close-modal">&times;</span>
            
            <div class="order-details-header">
                <h2>Order Details</h2>
                <span class="order-status status-${order.status.toLowerCase()}">
                    ${order.status}
                </span>
            </div>
            
            <div class="order-details-info">
                <div class="info-section">
                    <h3>Order Information</h3>
                    <p><strong>Order ID:</strong> #${order.id}</p>
                    <p><strong>Order Date:</strong> ${formatDate(order.created_at)}</p>
                    <p><strong>Payment Method:</strong> ${order.payment_method}</p>
                    <p><strong>Payment Status:</strong> ${order.payment_status}</p>
                </div>
                
                <div class="info-section">
                    <h3>Shipping Information</h3>
                    <p><strong>Name:</strong> ${order.shipping_address.name}</p>
                    <p><strong>Address:</strong> ${order.shipping_address.street}</p>
                    <p>${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}</p>
                    <p><strong>Phone:</strong> ${order.shipping_address.phone}</p>
                </div>
            </div>
            
            <div class="order-details-items">
                <h3>Order Items</h3>
                ${order.items.map(item => `
                    <div class="order-item-detail">
                        <img src="${item.product.image}" alt="${item.product.name}">
                        <div class="item-detail-info">
                            <h4>${item.product.name}</h4>
                            <p class="item-sku">SKU: ${item.product.sku}</p>
                            <p class="item-quantity">Quantity: ${item.quantity}</p>
                        </div>
                        <div class="item-detail-price">
                            <p class="unit-price">$${item.price.toFixed(2)} each</p>
                            <p class="total-price">$${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-details-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${order.subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping:</span>
                    <span>$${order.shipping_cost.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax:</span>
                    <span>$${order.tax.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>$${order.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.remove();
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

async function trackOrder(orderId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/orders/${orderId}/tracking`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load tracking information');
        }
        
        const tracking = await response.json();
        displayTrackingInfo(tracking);
        
    } catch (error) {
        console.error('Error loading tracking info:', error);
        showNotification('Failed to load tracking information', 'error');
    }
}

function displayTrackingInfo(tracking) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content tracking-modal">
            <span class="close-modal">&times;</span>
            
            <div class="tracking-header">
                <h2>Order Tracking</h2>
                <p class="tracking-number">Tracking Number: ${tracking.tracking_number}</p>
            </div>
            
            <div class="tracking-timeline">
                ${tracking.events.map((event, index) => `
                    <div class="tracking-event ${index === 0 ? 'active' : ''}">
                        <div class="event-marker"></div>
                        <div class="event-content">
                            <h4>${event.status}</h4>
                            <p class="event-location">${event.location}</p>
                            <p class="event-date">${formatDate(event.timestamp)}</p>
                            <p class="event-description">${event.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="tracking-footer">
                <p><strong>Carrier:</strong> ${tracking.carrier}</p>
                <p><strong>Estimated Delivery:</strong> ${formatDate(tracking.estimated_delivery)}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.remove();
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to cancel order');
        }
        
        showNotification('Order cancelled successfully', 'success');
        loadOrders(); // Reload orders list
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification('Failed to cancel order', 'error');
    }
}

function printReceipt(orderId) {
    window.open(`/api/orders/${orderId}/receipt`, '_blank');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').onclick = () => {
        notification.remove();
    };
}

// Export functions for use in other modules
window.ordersModule = {
    loadOrders,
    viewOrderDetails,
    trackOrder,
    cancelOrder,
    printReceipt
};
