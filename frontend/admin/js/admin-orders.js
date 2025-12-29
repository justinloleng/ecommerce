// Orders Management JavaScript
let currentOrders = [];

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
      <td>${order.item_count} item(s)</td>
      <td><strong>$${order.total_amount.toFixed(2)}</strong></td>
      <td><span class="badge badge-${order.status}">${
        order.status.charAt(0).toUpperCase() + order.status.slice(1)
      }</span></td>
      <td>
        ${
          order.status === "pending"
            ? `
          <button class="btn btn-success btn-sm" onclick="approveOrder(${order.id})">
            <i class="fas fa-check"></i> Approve
          </button>
          <button class="btn btn-danger btn-sm" onclick="showDeclineModal(${order.id})">
            <i class="fas fa-times"></i> Decline
          </button>
        `
            : order.status === "processing"
            ? `
          <button class="btn btn-primary btn-sm" onclick="updateOrderStatus(${order.id}, 'shipped')">
            <i class="fas fa-shipping-fast"></i> Mark Shipped
          </button>
        `
            : order.status === "shipped"
            ? `
          <button class="btn btn-success btn-sm" onclick="updateOrderStatus(${order.id}, 'delivered')">
            <i class="fas fa-check-circle"></i> Mark Delivered
          </button>
        `
            : "-"
        }
      </td>
    </tr>
  `
    )
    .join("");
}

function updateOrderStats(orders) {
  const pending = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter(
    (o) => o.status === "processing"
  ).length;
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
  // Update active button styling using CSS classes
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

document
  .getElementById("declineForm")
  .addEventListener("submit", async function (e) {
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

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

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
