// Orders functionality
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  checkAuthStatus();

  // Load orders
  loadOrders();

  // Setup navigation
  setupNavigation();

  // Setup filter
  document
    .getElementById("statusFilter")
    .addEventListener("change", function () {
      loadOrders(this.value);
    });
});

function setupNavigation() {
  // Logout
  document.getElementById("logoutBtn").addEventListener("click", function (e) {
    e.preventDefault();
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  });

  // Update cart count
  updateCartCount();
}

async function loadOrders(status = "all") {
  try {
    showLoading();

    const ordersList = document.getElementById("ordersList");
    ordersList.innerHTML =
      '<div class="loading-orders"><div class="loading-spinner"></div></div>';

    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // Fetch orders from API
    const response = await fetch(`${API_BASE_URL}/orders/user/${user.id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load orders");
    }

    let orders = await response.json();

    // Filter by status if needed
    if (status !== "all") {
      orders = orders.filter((order) => order.status === status);
    }

    // Display orders
    displayOrders(orders);
  } catch (error) {
    console.error("Error loading orders:", error);

    const ordersList = document.getElementById("ordersList");
    ordersList.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading orders</h3>
                <p>${error.message}</p>
            </div>
        `;

    showToast("Failed to load orders", "error");
  } finally {
    hideLoading();
  }
}

function displayOrders(orders) {
  const ordersList = document.getElementById("ordersList");

  if (!orders || orders.length === 0) {
    ordersList.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-box-open"></i>
                <h3>No orders found</h3>
                <p>You haven't placed any orders yet</p>
                <a href="products.html" class="btn-shopping">
                    <i class="fas fa-store"></i> Start Shopping
                </a>
            </div>
        `;
    return;
  }

  let ordersHTML = "";

  orders.forEach((order) => {
    const statusClass = `status-${order.status}`;
    const statusText =
      order.status.charAt(0).toUpperCase() + order.status.slice(1);
    const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    ordersHTML += `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order #${order.order_number}</h3>
                        <div class="order-meta">
                            <div>Placed on ${orderDate}</div>
                            <div>${order.item_count || 0} items</div>
                        </div>
                    </div>
                    <div class="order-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>
                
                <div class="order-items">
                    ${getOrderItemsPreview(order.items || [])}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        Total: $${
                          order.total_amount
                            ? order.total_amount.toFixed(2)
                            : "0.00"
                        }
                    </div>
                    <div class="order-actions">
                        <button class="btn-view-details" onclick="viewOrderDetails(${
                          order.id
                        })">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                        <button class="btn-track" onclick="trackOrder(${
                          order.id
                        })">
                            <i class="fas fa-shipping-fast"></i>
                            Track Order
                        </button>
                    </div>
                </div>
            </div>
        `;
  });

  ordersList.innerHTML = ordersHTML;
}

function getOrderItemsPreview(items) {
  if (!items || items.length === 0) {
    return '<div style="color: #718096; text-align: center; padding: 20px;">No items</div>';
  }

  // Show only first 2-3 items as preview
  const previewItems = items.slice(0, 3);
  let itemsHTML = "";

  previewItems.forEach((item) => {
    itemsHTML += `
            <div class="order-item">
                <div class="item-preview">
                    <div class="item-image">
                        <img src="${
                          item.image_url ||
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
                        }" 
                             alt="${item.name}"
                             onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
                    </div>
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <div class="item-quantity">Quantity: ${
                          item.quantity
                        }</div>
                    </div>
                </div>
                <div class="item-price">
                    $${
                      item.price_at_time
                        ? item.price_at_time.toFixed(2)
                        : "0.00"
                    }
                </div>
            </div>
        `;
  });

  // Show "and X more" if there are more items
  if (items.length > 3) {
    itemsHTML += `
            <div style="text-align: center; padding: 15px; color: #718096; font-size: 0.9rem;">
                and ${items.length - 3} more item${
      items.length - 3 > 1 ? "s" : ""
    }
            </div>
        `;
  }

  return itemsHTML;
}

async function viewOrderDetails(orderId) {
  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load order details");
    }

    const order = await response.json();

    // Display order details in modal
    displayOrderDetails(order);
  } catch (error) {
    console.error("Error loading order details:", error);
    showToast("Failed to load order details", "error");
  } finally {
    hideLoading();
  }
}

function displayOrderDetails(order) {
  const statusClass = `status-${order.status}`;
  const statusText =
    order.status.charAt(0).toUpperCase() + order.status.slice(1);
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build items HTML
  let itemsHTML = "";
  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      const itemTotal = item.price_at_time * item.quantity;
      itemsHTML += `
                <div class="order-item">
                    <div class="item-preview">
                        <div class="item-image">
                            <img src="${
                              item.image_url ||
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
                            }" 
                                 alt="${item.name}"
                                 onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
                        </div>
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            <div class="item-quantity">Quantity: ${
                              item.quantity
                            }</div>
                            <div style="color: #718096; font-size: 0.9rem; margin-top: 5px;">
                                ${item.description || ""}
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="item-price">$${item.price_at_time.toFixed(
                          2
                        )} each</div>
                        <div style="font-weight: 700; color: #2d3748; margin-top: 5px;">
                            $${itemTotal.toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
    });
  }

  const detailsHTML = `
        <div class="order-details-header">
            <h2>Order #${order.order_number}</h2>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 1.1rem; margin-bottom: 5px;">${orderDate}</div>
                    <div class="order-status ${statusClass}" style="display: inline-block;">
                        ${statusText}
                    </div>
                </div>
                <button class="modal-close" onclick="closeOrderModal()" style="background: rgba(255,255,255,0.2); color: white; border: none; font-size: 1.5rem; cursor: pointer; padding: 5px 15px
                                <button class="modal-close" onclick="closeOrderModal()" style="background: rgba(255,255,255,0.2); color: white; border: none; font-size: 1.5rem; cursor: pointer; padding: 5px 15px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                    ×
                </button>
            </div>
        </div>
        
        <div class="order-details-content">
            <div class="details-section">
                <h3><i class="fas fa-map-marker-alt"></i> Shipping Address</h3>
                <div class="shipping-info">
                    ${
                      order.shipping_address
                        ? typeof order.shipping_address === 'string'
                          ? `<p>${order.shipping_address}</p>`
                          : `
                        <p><strong>${
                          order.shipping_address.full_name || ""
                        }</strong></p>
                        <p>${order.shipping_address.street || ""}</p>
                        ${
                          order.shipping_address.street2
                            ? `<p>${order.shipping_address.street2}</p>`
                            : ""
                        }
                        <p>${order.shipping_address.city || ""}, ${
                            order.shipping_address.state || ""
                          } ${order.shipping_address.zip_code || ""}</p>
                        <p>${order.shipping_address.country || ""}</p>
                        ${
                          order.shipping_address.phone
                            ? `<p><i class="fas fa-phone"></i> ${order.shipping_address.phone}</p>`
                            : ""
                        }
                        ${
                          order.shipping_address.email
                            ? `<p><i class="fas fa-envelope"></i> ${order.shipping_address.email}</p>`
                            : ""
                        }
                    `
                        : "<p>No shipping address provided</p>"
                    }
                </div>
            </div>
            
            <div class="details-section">
                <h3><i class="fas fa-credit-card"></i> Payment Information</h3>
                <div class="payment-info">
                    ${
                      order.payment_method
                        ? `
                        <p><strong>${order.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong></p>
                        ${
                          order.payment_status
                            ? `<p>Status: <span class="status-${order.payment_status}">${order.payment_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></p>`
                            : ""
                        }
                        ${
                          order.transaction_id
                            ? `<p>Transaction ID: ${order.transaction_id}</p>`
                            : ""
                        }
                    `
                        : "<p>No payment information available</p>"
                    }
                </div>
            </div>
            
            <div class="details-section">
                <h3><i class="fas fa-box"></i> Order Items (${
                  order.items ? order.items.length : 0
                })</h3>
                <div class="order-items-list">
                    ${itemsHTML || "<p>No items in this order</p>"}
                </div>
            </div>
            
            <div class="details-section">
                <h3><i class="fas fa-receipt"></i> Order Summary</h3>
                <div class="order-summary">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>$${
                          order.subtotal ? order.subtotal.toFixed(2) : "0.00"
                        }</span>
                    </div>
                    ${
                      order.shipping_cost
                        ? `
                        <div class="summary-row">
                            <span>Shipping:</span>
                            <span>$${order.shipping_cost.toFixed(2)}</span>
                        </div>
                    `
                        : ""
                    }
                    ${
                      order.tax_amount
                        ? `
                        <div class="summary-row">
                            <span>Tax:</span>
                            <span>$${order.tax_amount.toFixed(2)}</span>
                        </div>
                    `
                        : ""
                    }
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span>$${
                          order.total_amount
                            ? order.total_amount.toFixed(2)
                            : "0.00"
                        }</span>
                    </div>
                </div>
            </div>
            
            ${
              order.notes
                ? `
                <div class="details-section">
                    <h3><i class="fas fa-sticky-note"></i> Order Notes</h3>
                    <div class="order-notes">
                        <p>${order.notes}</p>
                    </div>
                </div>
            `
                : ""
            }
        </div>
        
        <div class="order-details-footer">
            <button class="btn-primary" onclick="trackOrder(${order.id})">
                <i class="fas fa-shipping-fast"></i> Track Order
            </button>
            <button class="btn-secondary" onclick="printOrder(${order.id})">
                <i class="fas fa-print"></i> Print Receipt
            </button>
            ${
              order.status === "pending" || order.status === "processing"
                ? `
                <button class="btn-danger" onclick="cancelOrder(${order.id})">
                    <i class="fas fa-times-circle"></i> Cancel Order
                </button>
            `
                : ""
            }
        </div>
    `;

  // Create and display modal
  const modal = document.createElement("div");
  modal.className = "modal order-details-modal";
  modal.innerHTML = detailsHTML;

  document.body.appendChild(modal);

  // Add modal styles if not already present
  if (!document.getElementById("order-modal-styles")) {
    const styles = document.createElement("style");
    styles.id = "order-modal-styles";
    styles.textContent = `
            .order-details-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                z-index: 1000;
                animation: modalFadeIn 0.3s ease;
            }
            
            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -60%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
            
            .order-details-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 12px 12px 0 0;
            }
            
            .order-details-content {
                padding: 30px;
            }
            
            .details-section {
                margin-bottom: 30px;
                padding-bottom: 30px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .details-section:last-child {
                border-bottom: none;
            }
            
            .details-section h3 {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
                color: #4a5568;
            }
            
            .shipping-info p {
                margin: 5px 0;
                color: #718096;
            }
            
            .payment-info p {
                margin: 5px 0;
                color: #718096;
            }
            
            .order-items-list {
                background: #f7fafc;
                border-radius: 8px;
                padding: 20px;
            }
            
            .order-summary {
                background: #f7fafc;
                border-radius: 8px;
                padding: 20px;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .summary-row.total {
                font-weight: 700;
                font-size: 1.2rem;
                color: #2d3748;
                border-bottom: none;
                padding-top: 20px;
            }
            
            .order-details-footer {
                padding: 20px 30px;
                background: #f7fafc;
                border-radius: 0 0 12px 12px;
                display: flex;
                gap: 15px;
                justify-content: flex-end;
            }
            
            .order-details-footer button {
                padding: 12px 24px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
            }
            
            .order-details-footer .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .order-details-footer .btn-secondary {
                background: white;
                color: #4a5568;
                border: 2px solid #e2e8f0;
            }
            
            .order-details-footer .btn-danger {
                background: #fc8181;
                color: white;
            }
            
            .order-details-footer button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999;
                animation: backdropFadeIn 0.3s ease;
            }
            
            @keyframes backdropFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
    document.head.appendChild(styles);
  }

  // Add backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.onclick = closeOrderModal;
  document.body.appendChild(backdrop);
}

function closeOrderModal() {
  const modal = document.querySelector(".order-details-modal");
  const backdrop = document.querySelector(".modal-backdrop");

  if (modal) modal.remove();
  if (backdrop) backdrop.remove();
}

async function trackOrder(orderId) {
  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load tracking information");
    }

    const tracking = await response.json();

    // Display tracking information
    displayTrackingInfo(orderId, tracking);
  } catch (error) {
    console.error("Error loading tracking:", error);
    showToast("Failed to load tracking information", "error");

    // If no tracking info, show basic order status
    const orderResponse = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      credentials: "include",
    });

    if (orderResponse.ok) {
      const order = await orderResponse.json();
      displayTrackingInfo(orderId, {
        order_number: order.order_number,
        status: order.status,
        estimated_delivery: order.estimated_delivery,
        shipping_method: order.shipping_method,
      });
    }
  } finally {
    hideLoading();
  }
}

function displayTrackingInfo(orderId, tracking) {
  const statusSteps = [
    { id: "pending", label: "Order Placed", icon: "fas fa-shopping-cart" },
    { id: "processing", label: "Processing", icon: "fas fa-cog" },
    { id: "shipped", label: "Shipped", icon: "fas fa-shipping-fast" },
    { id: "delivered", label: "Delivered", icon: "fas fa-check-circle" },
    { id: "cancelled", label: "Cancelled", icon: "fas fa-times-circle" },
  ];

  // Get current status index
  const currentStatusIndex = statusSteps.findIndex(
    (step) => step.id === tracking.status
  );

  let stepsHTML = "";
  statusSteps.forEach((step, index) => {
    const isActive = index <= currentStatusIndex;
    const isCurrent = index === currentStatusIndex;

    stepsHTML += `
            <div class="tracking-step ${isActive ? "active" : ""} ${
      isCurrent ? "current" : ""
    }">
                <div class="step-icon">
                    <i class="${step.icon}"></i>
                </div>
                <div class="step-label">${step.label}</div>
                ${
                  index < statusSteps.length - 1
                    ? '<div class="step-connector"></div>'
                    : ""
                }
            </div>
        `;
  });

  // Build timeline events
  let timelineHTML = "";
  if (tracking.events && tracking.events.length > 0) {
    tracking.events.forEach((event) => {
      const eventDate = new Date(event.timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      timelineHTML += `
                <div class="timeline-event">
                    <div class="event-icon">
                        <i class="fas fa-${event.icon || "circle"}"></i>
                    </div>
                    <div class="event-content">
                        <div class="event-title">${event.title}</div>
                        <div class="event-description">${
                          event.description || ""
                        }</div>
                        <div class="event-time">${eventDate}</div>
                    </div>
                </div>
            `;
    });
  } else {
    timelineHTML = `
            <div class="no-events">
                <i class="fas fa-clock"></i>
                <h4>Tracking information will appear here</h4>
                <p>Check back soon for updates on your order status</p>
            </div>
        `;
  }

  const trackingHTML = `
        <div class="tracking-modal">
            <div class="tracking-header">
                <h2><i class="fas fa-shipping-fast"></i> Track Order #${
                  tracking.order_number || "N/A"
                }</h2>
                <button class="modal-close" onclick="closeTrackingModal()">×</button>
            </div>
            
            <div class="tracking-content">
                <div class="status-summary">
                    <div class="current-status">
                        <div class="status-label">Current Status</div>
                        <div class="status-value status-${tracking.status}">
                            ${
                              tracking.status
                                ? tracking.status.charAt(0).toUpperCase() +
                                  tracking.status.slice(1)
                                : "Unknown"
                            }
                        </div>
                    </div>
                    
                    ${
                      tracking.estimated_delivery
                        ? `
                        <div class="delivery-estimate">
                            <div class="estimate-label">Estimated Delivery</div>
                            <div class="estimate-value">
                                <i class="fas fa-calendar-alt"></i>
                                ${new Date(
                                  tracking.estimated_delivery
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                            </div>
                        </div>
                    `
                        : ""
                    }
                    
                    ${
                      tracking.shipping_method
                        ? `
                        <div class="shipping-method">
                            <div class="method-label">Shipping Method</div>
                            <div class="method-value">
                                <i class="fas fa-truck"></i>
                                ${tracking.shipping_method}
                            </div>
                        </div>
                    `
                        : ""
                    }
                    
                    ${
                      tracking.tracking_number
                        ? `
                        <div class="tracking-number">
                            <div class="tracking-label">Tracking Number</div>
                            <div class="tracking-value">
                                <i class="fas fa-barcode"></i>
                                ${tracking.tracking_number}
                            </div>
                        </div>
                    `
                        : ""
                    }
                </div>
                
                <div class="tracking-progress">
                    <h3>Order Progress</h3>
                    <div class="progress-steps">
                        ${stepsHTML}
                    </div>
                </div>
                
                <div class="tracking-timeline">
                    <h3>Order Timeline</h3>
                    <div class="timeline-events">
                        ${timelineHTML}
                    </div>
                </div>
                
                ${
                  tracking.carrier_url
                    ? `
                    <div class="tracking-actions">
                        <a href="${tracking.carrier_url}" target="_blank" class="btn-primary">
                            <i class="fas fa-external-link-alt"></i>
                            Track on Carrier Website
                        </a>
                    </div>
                `
                    : ""
                }
            </div>
        </div>
    `;

  // Display tracking modal
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = trackingHTML;

  document.body.appendChild(modal);

  // Add backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.onclick = closeTrackingModal;
  document.body.appendChild(backdrop);
}

function closeTrackingModal() {
  const modal = document.querySelector(".tracking-modal");
  const backdrop = document.querySelector(".modal-backdrop");

  if (modal) modal.remove();
  if (backdrop) backdrop.remove();
}

async function cancelOrder(orderId) {
  if (
    !confirm(
      "Are you sure you want to cancel this order? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to cancel order");
    }

    showToast("Order cancelled successfully", "success");

    // Refresh orders list
    loadOrders(document.getElementById("statusFilter").value);

    // Close any open modals
    closeOrderModal();
    closeTrackingModal();
  } catch (error) {
    console.error("Error cancelling order:", error);
    showToast("Failed to cancel order", "error");
  } finally {
    hideLoading();
  }
}

function printOrder(orderId) {
  // In a real application, this would generate a printable receipt
  // For now, we'll show a message and use window.print()

  showToast("Preparing receipt for printing...", "info");

  setTimeout(() => {
    // Create printable content
    const printContent = `
            <html>
                <head>
                    <title>Order Receipt - #${orderId}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        .receipt-header { text-align: center; margin-bottom: 40px; }
                        .receipt-details { margin-bottom: 30px; }
                        .receipt-items { width: 100%; border-collapse: collapse; }
                        .receipt-items th { background: #f3f4f6; padding: 10px; }
                        .receipt-items td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
                        .receipt-total { text-align: right; font-weight: bold; margin-top: 20px; }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-header">
                        <h1>Order Receipt</h1>
                        <p>Order #${orderId}</p>
                        <p>Printed: ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="receipt-details">
                        <p>Thank you for your order!</p>
                    </div>
                    
                    <p class="no-print">Your receipt is being generated. Please use your browser's print function.</p>
                </body>
            </html>
        `;

    // Open print window
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  }, 1000);
}

// Add these helper functions if not already defined
function showLoading() {
  // Implement loading overlay
  let loading = document.getElementById("loadingOverlay");
  if (!loading) {
    loading = document.createElement("div");
    loading.id = "loadingOverlay";
    loading.className = "loading-overlay";
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
  }
  loading.style.display = "flex";
}

function hideLoading() {
  const loading = document.getElementById("loadingOverlay");
  if (loading) {
    loading.style.display = "none";
  }
}

function showToast(message, type = "info") {
  // Implement toast notification
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
        <i class="fas fa-${
          type === "success"
            ? "check-circle"
            : type === "error"
            ? "exclamation-circle"
            : "info-circle"
        }"></i>
        <span>${message}</span>
    `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Check auth status
function checkAuthStatus() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Update user info in header if elements exist
  const userNameElement = document.getElementById("userName");
  if (userNameElement) {
    userNameElement.textContent = user.name || user.email;
  }
}

// Logout function
function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("cart");
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

// Update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = cart.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  const cartCountElement = document.querySelector(".cart-count");
  if (cartCountElement) {
    cartCountElement.textContent = cartCount;
    cartCountElement.style.display = cartCount > 0 ? "inline-block" : "none";
  }
}

// Make functions globally available
window.viewOrderDetails = viewOrderDetails;
window.trackOrder = trackOrder;
window.printOrder = printOrder;
window.cancelOrder = cancelOrder;
window.closeOrderModal = closeOrderModal;
window.closeTrackingModal = closeTrackingModal;
