// Admin Panel Main JavaScript
const API_BASE_URL = "http://localhost:5000/api";

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
    setTimeout(() => (window.location.href = "../customer/dashboard.html"), 2000);
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

// Close modals when clicking outside
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeModal(modal.id);
    }
  });
});
