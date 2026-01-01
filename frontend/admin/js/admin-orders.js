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
      <td>
        <strong>$${order.total_amount.toFixed(2)}</strong>
        ${order.payment_method === 'online_payment' && order.payment_proof_url ? 
          `<br><small style="color: #48bb78;"><i class="fas fa-check-circle"></i> Payment proof uploaded</small>` : 
          order.payment_method === 'online_payment' ? 
          `<br><small style="color: #f6ad55;"><i class="fas fa-clock"></i> Awaiting payment proof</small>` : 
          ''}
      </td>
      <td><span class="badge badge-${order.status}">${
        order.status.charAt(0).toUpperCase() + order.status.slice(1)
      }</span></td>
      <td>
        ${order.payment_method === 'online_payment' && order.payment_proof_url ? 
          `<button class="btn btn-info btn-sm" onclick="viewPaymentProof('${order.payment_proof_url}', '${order.payment_proof_filename || 'Payment Proof'}')">
            <i class="fas fa-eye"></i> View Proof
          </button>
          <br>` : ''}
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

function viewPaymentProof(proofUrl, filename) {
  // Create modal to display payment proof
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'paymentProofModal';
  
  const fileExtension = proofUrl.split('.').pop().toLowerCase();
  const isPDF = fileExtension === 'pdf';
  
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closePaymentProofModal()"></div>
    <div class="modal-box" style="max-width: 800px;">
      <div class="modal-header">
        <h3><i class="fas fa-file-invoice"></i> Payment Proof - ${filename}</h3>
        <button class="close-modal" onclick="closePaymentProofModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body" style="text-align: center; padding: 20px;">
        ${isPDF ? 
          `<iframe src="${API_BASE_URL}${proofUrl}" style="width: 100%; height: 600px; border: 1px solid #ddd;"></iframe>
           <p style="margin-top: 10px;">
             <a href="${API_BASE_URL}${proofUrl}" target="_blank" class="btn btn-primary">
               <i class="fas fa-external-link-alt"></i> Open in New Tab
             </a>
           </p>` :
          `<img src="${API_BASE_URL}${proofUrl}" alt="Payment Proof" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;">
           <p style="margin-top: 10px;">
             <a href="${API_BASE_URL}${proofUrl}" target="_blank" class="btn btn-primary">
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
  const modal = document.getElementById('paymentProofModal');
  if (modal) {
    modal.remove();
  }
}
