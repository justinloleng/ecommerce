// Admin Panel Main JavaScript
const API_BASE_URL = "http://localhost:5000/api";
const STATIC_BASE_URL = API_BASE_URL.replace("/api", "");
let currentOrders = [];

// Check admin authentication
document.addEventListener("DOMContentLoaded", function () {
  checkAdminAuth();
  loadOrders();
});

function checkAdminAuth() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    window.location.href = "../customer/index.html";
    return;
  }

  if (!user.is_admin) {
    showToast("Access denied. Admin privileges required.", "error");
    setTimeout(
      () => (window.location.href = "../customer/dashboard.html"),
      2000
    );
    return;
  }

  document.getElementById("adminName").textContent =
    user.first_name || user.username || "Admin";
}

function switchTab(tab, event) {
  // Update tab buttons
  document
    .querySelectorAll(".tab-button")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.closest(".tab-button").classList.add("active");

  // Update tab content
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));
  document.getElementById(`${tab}-tab`).classList.add("active");

  // Load data for the tab
  if (tab === "orders") {
    loadOrders();
  } else if (tab === "products") {
    loadProducts();
  } else if (tab === "categories") {
    loadCategories();
  } else if (tab === "reports") {
    // Reports tab - user needs to click Generate Report button
  } else if (tab === "users") {
    loadUsers();
  }
}

// ========== UTILITY FUNCTIONS ==========
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  toast.className = `toast ${type}`;
  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    window.location.href = "../customer/index.html";
  }
}

// ========== ORDER MANAGEMENT FUNCTIONS ==========
async function loadOrders() {
  try {
    // Show loading state
    const tbody = document.getElementById("ordersTableBody");
    tbody.innerHTML = `
      <tr><td colspan="7" class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading orders...</p>
      </td></tr>
    `;

    const response = await fetch(`${API_BASE_URL}/admin/orders`);

    if (!response.ok) {
      throw new Error("Failed to load orders");
    }

    currentOrders = await response.json();
    displayOrders(currentOrders);
    updateOrderStats(currentOrders);
  } catch (error) {
    console.error("Error loading orders:", error);
    document.getElementById("ordersTableBody").innerHTML = `
      <tr><td colspan="7" class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load orders</p>
      </td></tr>
    `;
  }
}

function displayOrders(orders) {
  const tbody = document.getElementById("ordersTableBody");

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No orders found</p>
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = orders
    .map(
      (order) => `
    <tr>
      <td><strong>${order.order_number}</strong></td>
      <td>
        ${order.first_name} ${order.last_name}<br>
        <small style="color: #666;">${order.email}</small>
      </td>
      <td>${new Date(order.created_at).toLocaleDateString()}</td>
      <td>
        <!-- FIXED: Display total quantity instead of item count -->
        <strong>${order.total_quantity || 0} item(s)</strong>
        ${
          order.items && order.items.length > 0
            ? `<br><small style="color: #666; font-size: 0.85em;">
                ${order.items
                  .map((item) => `${item.quantity || 1}x ${item.name}`)
                  .join(", ")}
               </small>`
            : ""
        }
      </td>
      <td>
        <strong>$${order.total_amount.toFixed(2)}</strong>
        ${
          order.payment_method === "online_payment" && order.payment_proof_url
            ? `<br><small style="color: #48bb78;"><i class="fas fa-check-circle"></i> Payment proof uploaded</small>`
            : order.payment_method === "online_payment"
            ? `<br><small style="color: #f6ad55;"><i class="fas fa-clock"></i> Awaiting payment proof</small>`
            : ""
        }
      </td>
      <td><span class="badge badge-${order.status}">${
        order.status.charAt(0).toUpperCase() + order.status.slice(1)
      }</span></td>
      <td>
        <button class="btn btn-primary btn-sm btn-block" onclick="viewOrderDetails(${
          order.id
        })">
          <i class="fas fa-eye"></i> Details
        </button>
        
        ${
          order.status === "pending"
            ? `
          <div style="display: flex; gap: 4px; margin-top: 5px;">
            <button class="btn btn-success btn-sm btn-action" onclick="approveOrder(${order.id})">
              <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-danger btn-sm btn-action" onclick="showDeclineModal(${order.id})">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `
            : order.status === "processing"
            ? `
          <button class="btn btn-primary btn-sm btn-block" onclick="updateOrderStatus(${order.id}, 'shipped')" style="margin-top: 5px;">
            <i class="fas fa-shipping-fast"></i> Ship
          </button>
        `
            : order.status === "shipped"
            ? `
          <button class="btn btn-success btn-sm btn-block" onclick="updateOrderStatus(${order.id}, 'delivered')" style="margin-top: 5px;">
            <i class="fas fa-check-circle"></i> Deliver
          </button>
        `
            : ""
        }
      </td>
    </tr>
  `
    )
    .join("");
}

function updateOrderStats(orders) {
  const pending = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter((o) => o.status === "processing").length;
  const completed = orders.filter((o) => o.status === "delivered").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const declined = orders.filter((o) => o.status === "declined").length;

  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("processingCount").textContent = processing;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("cancelledCount").textContent = cancelled;
  document.getElementById("declinedCount").textContent = declined;
}

function filterAdminOrders(status, event) {

  document.querySelectorAll(".order-filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  if (event && event.target) {
    event.target.classList.add("active");
  }

  // Filter and display orders
  const filteredOrders =
    status === "all"
      ? currentOrders
      : currentOrders.filter((order) => order.status === status);

  displayOrders(filteredOrders);
}

async function approveOrder(orderId) {
  if (!confirm("Are you sure you want to approve this order?")) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/orders/${orderId}/approve`,
      {
        method: "PUT",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to approve order");
    }

    showToast("Order approved successfully", "success");
    loadOrders();
  } catch (error) {
    console.error("Error approving order:", error);
    showToast("Failed to approve order", "error");
  }
}

function showDeclineModal(orderId) {
  document.getElementById("declineOrderId").value = orderId;
  document.getElementById("declineReason").value = "";
  document.getElementById("declineModal").classList.add("active");
}

// Add the decline form submit listener
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("declineForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      const orderId = document.getElementById("declineOrderId").value;
      const reason = document.getElementById("declineReason").value;

      try {
        const response = await fetch(
          `${API_BASE_URL}/admin/orders/${orderId}/decline`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ decline_reason: reason }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to decline order");
        }

        showToast("Order declined successfully", "success");
        closeModal("declineModal");
        loadOrders();
      } catch (error) {
        console.error("Error declining order:", error);
        showToast("Failed to decline order", "error");
      }
    });
});

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      throw new Error("Failed to update order status");
    }

    showToast("Order status updated successfully", "success");
    loadOrders();
  } catch (error) {
    console.error("Error updating order status:", error);
    showToast("Failed to update order status", "error");
  }
}

function viewPaymentProof(proofUrl, filename) {
  // Validate proofUrl
  if (!proofUrl || typeof proofUrl !== "string" || proofUrl.trim() === "") {
    showToast("Invalid payment proof URL", "error");
    return;
  }

  // Create modal to display payment proof
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.id = "paymentProofModal";

  // Safely extract file extension
  const urlParts = proofUrl.split(".");
  const fileExtension =
    urlParts.length > 1 ? urlParts[urlParts.length - 1].toLowerCase() : "";
  const isPDF = fileExtension === "pdf";

  modal.innerHTML = `
    <div class="modal-overlay" onclick="closePaymentProofModal()"></div>
    <div class="modal-box" style="max-width: 800px;">
      <div class="modal-header">
        <h3><i class="fas fa-file-invoice"></i> Payment Proof - ${
          filename || "Document"
        }</h3>
        <button class="close-modal" onclick="closePaymentProofModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body" style="text-align: center; padding: 20px;">
        ${
          isPDF
            ? `<iframe src="${STATIC_BASE_URL}${proofUrl}" style="width: 100%; height: 600px; border: 1px solid #ddd;"></iframe>
           <p style="margin-top: 10px;">
             <a href="${STATIC_BASE_URL}${proofUrl}" target="_blank" class="btn btn-primary">
               <i class="fas fa-external-link-alt"></i> Open in New Tab
             </a>
           </p>`
            : `<img src="${STATIC_BASE_URL}${proofUrl}" alt="Payment Proof" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;">
           <p style="margin-top: 10px;">
             <a href="${STATIC_BASE_URL}${proofUrl}" target="_blank" class="btn btn-primary">
               <i class="fas fa-external-link-alt"></i> Open in New Tab
             </a>
           </p>`
        }
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closePaymentProofModal() {
  const modal = document.getElementById("paymentProofModal");
  if (modal) {
    modal.remove();
  }
}

async function viewOrderDetails(orderId) {
  try {
    console.log("Viewing order details for ID:", orderId);

    // Constants for order details display
    const SHIPPING_COST = 5.0; // Standard shipping cost
    const DESCRIPTION_TRUNCATE_LENGTH = 60;

    // Show loading toast
    showToast("Loading order details...", "info");

    // Fetch order details
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);

    if (!response.ok) {
      throw new Error("Failed to load order details");
    }

    const order = await response.json();
    console.log("Order details:", order);

    // Create modal to display order details
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "orderDetailsModal";

    // Calculate subtotal
    let subtotal = 0;
    if (order.items && order.items.length > 0) {
      subtotal = order.items.reduce(
        (sum, item) => sum + item.price_at_time * item.quantity,
        0
      );
    }

    // Format items list
    let itemsHTML = "";
    if (order.items && order.items.length > 0) {
      itemsHTML = order.items
        .map(
          (item) => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${STATIC_BASE_URL}${
            item.image_url || "/static/uploads/products/default.jpg"
          }" 
                   alt="${item.name}" 
                   style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                   onerror="this.src='${STATIC_BASE_URL}/static/uploads/products/default.jpg'">
              <div>
                <strong>${item.name}</strong>
                ${
                  item.description
                    ? `<br><small style="color: #666;">${item.description.substring(
                        0,
                        DESCRIPTION_TRUNCATE_LENGTH
                      )}...</small>`
                    : ""
                }
              </div>
            </div>
          </td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">$${parseFloat(
            item.price_at_time
          ).toFixed(2)}</td>
          <td style="text-align: right;"><strong>$${(
            parseFloat(item.price_at_time) * item.quantity
          ).toFixed(2)}</strong></td>
        </tr>
      `
        )
        .join("");
    } else {
      itemsHTML =
        '<tr><td colspan="4" style="text-align: center; color: #666;">No items found</td></tr>';
    }

    modal.innerHTML = `
      <div class="modal-overlay" onclick="closeOrderDetailsModal()"></div>
      <div class="modal-box" style="max-width: 900px;">
        <div class="modal-header">
          <h3><i class="fas fa-shopping-cart"></i> Order Details - ${
            order.order_number
          }</h3>
          <button class="close-modal" onclick="closeOrderDetailsModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" style="padding: 20px; max-height: 70vh; overflow-y: auto;">
          <!-- Order Status -->
          <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div>
                <label style="color: #718096; font-size: 0.875rem; display: block; margin-bottom: 5px;">Status</label>
                <span class="badge badge-${
                  order.status
                }" style="font-size: 1rem;">
                  ${
                    order.status.charAt(0).toUpperCase() + order.status.slice(1)
                  }
                </span>
              </div>
              <div>
                <label style="color: #718096; font-size: 0.875rem; display: block; margin-bottom: 5px;">Order Date</label>
                <strong>${new Date(order.created_at).toLocaleString()}</strong>
              </div>
              <div>
                <label style="color: #718096; font-size: 0.875rem; display: block; margin-bottom: 5px;">Payment Method</label>
                <strong>${
                  order.payment_method === "online_payment"
                    ? "Online Payment"
                    : "Cash on Delivery"
                }</strong>
              </div>
            </div>
            ${
              order.decline_reason
                ? `
              <div style="margin-top: 15px; padding: 10px; background: #fff5f5; border-left: 4px solid #f56565; border-radius: 4px;">
                <strong style="color: #c53030;">Decline Reason:</strong>
                <p style="margin: 5px 0 0 0; color: #742a2a;">${order.decline_reason}</p>
              </div>
            `
                : ""
            }
          </div>
          
          <!-- Order Items -->
          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 15px; color: #2d3748;">
              <i class="fas fa-box"></i> Order Items
            </h4>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #edf2f7; border-bottom: 2px solid #cbd5e0;">
                    <th style="padding: 12px; text-align: left;">Product</th>
                    <th style="padding: 12px; text-align: center;">Quantity</th>
                    <th style="padding: 12px; text-align: right;">Price</th>
                    <th style="padding: 12px; text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid #cbd5e0;">
                    <td colspan="3" style="padding: 12px; text-align: right;"><strong>Subtotal:</strong></td>
                    <td style="padding: 12px; text-align: right;"><strong>$${subtotal.toFixed(
                      2
                    )}</strong></td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding: 12px; text-align: right;"><strong>Shipping:</strong></td>
                    <td style="padding: 12px; text-align: right;"><strong>$${SHIPPING_COST.toFixed(
                      2
                    )}</strong></td>
                  </tr>
                  <tr style="background: #edf2f7; font-size: 1.125rem;">
                    <td colspan="3" style="padding: 12px; text-align: right;"><strong>Total:</strong></td>
                    <td style="padding: 12px; text-align: right;"><strong>$${parseFloat(
                      order.total_amount
                    ).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Customer & Shipping Information -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
              <h4 style="margin-bottom: 10px; color: #2d3748;">
                <i class="fas fa-user"></i> Customer Information
              </h4>
              <p style="margin: 5px 0;"><strong>User ID:</strong> ${
                order.user_id
              }</p>
            </div>
            
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
              <h4 style="margin-bottom: 10px; color: #2d3748;">
                <i class="fas fa-map-marker-alt"></i> Shipping Address
              </h4>
              <p style="margin: 5px 0; line-height: 1.6;">${
                order.shipping_address
              }</p>
            </div>
          </div>
          
          ${
            order.payment_method === "online_payment" && order.payment_proof_url
              ? `
            <div style="margin-top: 20px; background: #f7fafc; padding: 15px; border-radius: 8px;">
              <h4 style="margin-bottom: 10px; color: #2d3748;">
                <i class="fas fa-file-invoice"></i> Payment Proof
              </h4>
              <button class="btn btn-primary" onclick="viewPaymentProof('${
                order.payment_proof_url
              }', '${order.payment_proof_filename || "Payment Proof"}')">
                <i class="fas fa-eye"></i> View Payment Proof
              </button>
            </div>
          `
              : ""
          }
        </div>
        <div class="modal-footer" style="padding: 15px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn btn-secondary" onclick="closeOrderDetailsModal()">
            <i class="fas fa-times"></i> Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  } catch (error) {
    console.error("Error loading order details:", error);
    showToast("Failed to load order details", "error");
  }
}

function closeOrderDetailsModal() {
  const modal = document.getElementById("orderDetailsModal");
  if (modal) {
    modal.remove();
  }
}

// Close modals when clicking outside
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
});
