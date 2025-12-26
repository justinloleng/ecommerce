// Orders Management
// Store all orders data for filtering
let allOrdersData = [];

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  checkAuthStatus();

  // Setup navigation
  setupNavigation();

  // Load orders from API
  loadOrders();
});

function setupNavigation() {
  // Show admin link if user is admin
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.is_admin === 1) {
    const adminLink = document.getElementById("adminDashboardLink");
    if (adminLink) {
      adminLink.style.display = "block";
      adminLink.href = "admin.html";
    }
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (confirm("Are you sure you want to logout?")) {
        logout();
      }
    });
  }

  // Update cart count
  updateCartCount();
}

async function loadOrders() {
  try {
    showLoading();

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const response = await fetch(`${API_BASE_URL}/orders/user/${user.id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load orders");
    }

    const orders = await response.json();
    displayOrders(orders);
  } catch (error) {
    console.error("Error loading orders:", error);
    showToast("Failed to load orders", "error");
    // Show empty state on error
    displayOrders([]);
  } finally {
    hideLoading();
  }
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderOrderCard(order) {
  return `
    <div class="order-card" data-status="${order.status}">
        <div class="order-header">
            <div>
                <div class="order-id">${
                  order.order_number || "Order #" + order.id
                }</div>
                <div class="order-date">
                    <i class="fas fa-calendar"></i> ${new Date(
                      order.created_at
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </div>
            </div>
            <span class="order-status status-${order.status}">
                ${
                  order.status.charAt(0).toUpperCase() +
                  order.status.slice(1).replace("_", " ")
                }
            </span>
        </div>

        <div class="order-items">
            ${(order.items || [])
              .map(
                (item) => `
                <div class="order-item">
                    <img src="${
                      item.image_url ||
                      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300"
                    }" 
                         alt="${item.name}" 
                         class="item-image"
                         onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'">
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-quantity">Quantity: ${
                          item.quantity
                        }</div>
                        <div class="item-price">$${(
                          item.price_at_time * item.quantity
                        ).toFixed(2)}</div>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>

        ${
          order.status === "declined" && order.decline_reason
            ? `
            <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0; border-radius: 8px;">
                <strong style="color: #c62828;">
                    <i class="fas fa-info-circle"></i> Order Declined
                </strong>
                <p style="color: #666; margin: 5px 0 0 0;">
                    Reason: ${escapeHtml(order.decline_reason)}
                </p>
            </div>
        `
            : ""
        }

        <div class="order-total">
            Total: $${order.total_amount.toFixed(2)}
        </div>

        <div class="order-actions">
            ${
              order.status === "pending"
                ? `
                <button class="btn-cancel" onclick="cancelOrder(${order.id})">
                    <i class="fas fa-times"></i> Cancel Order
                </button>
            `
                : ""
            }
            <button class="btn-view-details" onclick="viewOrderDetails(${
              order.id
            })">
                <i class="fas fa-eye"></i> View Details
            </button>
        </div>
    </div>
  `;
}

function displayOrders(orders) {
  const ordersContent = document.getElementById("ordersContent");
  
  // Store orders data globally for filtering (with safety check)
  allOrdersData = orders || [];

  if (!orders || orders.length === 0) {
    ordersContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No orders found</h3>
                <p>You haven't placed any orders yet or no orders match this filter.</p>
            </div>
        `;
    return;
  }

  ordersContent.innerHTML = orders.map(order => renderOrderCard(order)).join("");
}

function filterOrders(status, event) {
  const ordersContent = document.getElementById("ordersContent");

  // Update active button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  if (event && event.target) {
    event.target.classList.add("active");
  }

  // Safety check: ensure allOrdersData is available
  if (!allOrdersData) {
    console.warn("No orders data available for filtering");
    return;
  }

  // Filter orders data based on status
  const filteredOrders = status === "all" 
    ? allOrdersData 
    : allOrdersData.filter(order => order.status === status);

  // Re-render with filtered orders or show empty state
  if (filteredOrders.length === 0) {
    // Replace innerHTML entirely with empty state
    ordersContent.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>No orders found</h3>
        <p>No orders match this filter.</p>
      </div>
    `;
  } else {
    // Re-render the filtered orders using the shared template function
    ordersContent.innerHTML = filteredOrders.map(order => renderOrderCard(order)).join("");
  }
}

async function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) {
    return;
  }

  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to cancel order");
    }

    showToast("Order cancelled successfully", "success");

    // Reload orders to reflect the change
    setTimeout(() => {
      loadOrders();
    }, 1000);
  } catch (error) {
    console.error("Error cancelling order:", error);
    showToast(error.message || "Failed to cancel order", "error");
  } finally {
    hideLoading();
  }
}

function viewOrderDetails(orderId) {
  // Navigate to order confirmation page to view details
  window.location.href = `order-confirmation.html?order_id=${orderId}`;
}

function updateCartCount() {
  const cartCountElement = document.querySelector(".cart-count");
  if (cartCountElement) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      fetch(`${API_BASE_URL}/cart?user_id=${user.id}`)
        .then((r) => r.json())
        .then((data) => {
          cartCountElement.textContent = data.item_count || 0;
        })
        .catch(() => {
          cartCountElement.textContent = 0;
        })
        .finally(() => {
          cartCountElement.style.display =
            parseInt(cartCountElement.textContent) > 0
              ? "inline-block"
              : "none";
        });
    }
  }
}

// Make functions globally accessible for onclick handlers
window.filterOrders = filterOrders;
window.cancelOrder = cancelOrder;
window.viewOrderDetails = viewOrderDetails;
