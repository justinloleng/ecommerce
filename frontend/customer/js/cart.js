// Cart functionality
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  checkAuthStatus();

  // Load cart
  loadCart();

  // Setup navigation
  setupNavigation();

  // Setup checkout button
  document
    .getElementById("checkoutBtn")
    .addEventListener("click", proceedToCheckout);
});

function setupNavigation() {
  // Show admin link if user is admin
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.is_admin === 1) {
    const adminLink = document.getElementById("adminDashboardLink");
    if (adminLink) {
      adminLink.style.display = "block";
      adminLink.href = "../admin/admin-panel.html";
    }
  }

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", function (e) {
    e.preventDefault();
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  });

  // Update cart count on load
  updateCartCount();
}

async function loadCart() {
  try {
    showLoading();

    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // Fetch cart from API
    const response = await fetch(`${API_BASE_URL}/cart?user_id=${user.id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load cart");
    }

    const cartData = await response.json();

    // Display cart items
    displayCartItems(cartData);

    // Update cart count
    updateCartCount(cartData.item_count);
  } catch (error) {
    console.error("Error loading cart:", error);

    // Fallback to localStorage cart
    displayCartFromLocalStorage();

    showToast("Using local cart data", "info");
  } finally {
    hideLoading();
  }
}

function displayCartItems(cartData) {
  const cartItemsContainer = document.getElementById("cartItems");

  if (!cartData.items || cartData.items.length === 0) {
    cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some products to your cart and they will appear here</p>
                <a href="products.html" class="btn-shopping">
                    <i class="fas fa-store"></i> Start Shopping
                </a>
            </div>
        `;

    // Update summary with zero values
    document.getElementById("subtotal").textContent = "$0.00";
    document.getElementById("total").textContent = "$5.00";
    document.getElementById("checkoutBtn").disabled = true;
    document.getElementById("checkoutBtn").innerHTML =
      '<i class="fas fa-lock"></i> Cart is Empty';
    document.getElementById("checkoutBtn").style.opacity = "0.5";
    document.getElementById("checkoutBtn").style.cursor = "not-allowed";

    return;
  }

  // Enable checkout button
  document.getElementById("checkoutBtn").disabled = false;
  document.getElementById("checkoutBtn").innerHTML =
    '<i class="fas fa-lock"></i> Proceed to Checkout';
  document.getElementById("checkoutBtn").style.opacity = "1";
  document.getElementById("checkoutBtn").style.cursor = "pointer";

  let itemsHTML = "";

  cartItemsContainer.innerHTML = ""; // Clear existing items

  cartData.items.forEach((item) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    const maxQuantity = item.stock_quantity || 0;
    const isAtMaxStock = item.quantity >= maxQuantity;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.dataset.itemId = item.id;
    cartItem.innerHTML = `
      <div class="item-image">
        <img src="${
          item.image_url ||
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
        }" 
             alt="${item.name}"
             onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
      </div>
      <div class="item-details">
        <h3 class="item-name">${item.name}</h3>
        <span class="item-category">${
          item.category_name || "Uncategorized"
        }</span>
        <div class="item-price">$${item.price.toFixed(2)}</div>
        
        ${
          maxQuantity > 0
            ? `
        <div class="stock-info">
          <small style="color: #718096;">
            <i class="fas fa-box"></i> Available: ${maxQuantity}
          </small>
        </div>
        `
            : ""
        }
        
        <div class="item-actions">
          <div class="quantity-controls">
            <button class="quantity-btn minus-btn" data-item-id="${item.id}">
              <i class="fas fa-minus"></i>
            </button>
            <input type="text" class="quantity-input" value="${item.quantity}" 
                   data-item-id="${item.id}">
            <button class="quantity-btn plus-btn" data-item-id="${item.id}" ${
      isAtMaxStock ? "disabled" : ""
    }>
              <i class="fas fa-plus"></i>
            </button>
          </div>
          ${
            isAtMaxStock
              ? `
          <div class="stock-warning" style="color: #e53e3e; font-size: 0.9rem; margin-top: 5px;">
            <i class="fas fa-exclamation-triangle"></i>
            <small>Maximum stock reached</small>
          </div>
          `
              : ""
          }
          <button class="remove-item" data-item-id="${item.id}">
            <i class="fas fa-trash"></i> Remove
          </button>
        </div>
      </div>
      <div class="item-total">
        $${itemTotal}
      </div>
    `;

    cartItemsContainer.appendChild(cartItem);
  });

  // Add event listeners after rendering
  setTimeout(() => {
    document.querySelectorAll(".minus-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const itemId = parseInt(this.dataset.itemId);
        const input = this.parentElement.querySelector(".quantity-input");
        const currentQty = parseInt(input.value);
        const maxStock = parseInt(input.dataset.max) || 0;

        if (currentQty > 1) {
          updateQuantity(itemId, currentQty - 1, maxStock);
        }
      });
    });

    document.querySelectorAll(".plus-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        if (this.disabled) return;

        const itemId = parseInt(this.dataset.itemId);
        const input = this.parentElement.querySelector(".quantity-input");
        const currentQty = parseInt(input.value);
        const maxStock = parseInt(input.dataset.max) || 0;

        updateQuantity(itemId, currentQty + 1, maxStock);
      });
    });

    document.querySelectorAll(".remove-item").forEach((btn) => {
      btn.addEventListener("click", function () {
        const itemId = parseInt(this.dataset.itemId);
        removeFromCart(itemId);
      });
    });

    document.querySelectorAll(".quantity-input").forEach((input) => {
      input.addEventListener("change", function () {
        const itemId = parseInt(this.dataset.itemId);
        const maxStock = parseInt(this.dataset.max) || 0;
        updateQuantityFromInput(itemId, this.value, maxStock);
      });
    });
  }, 100);

  // Update summary
  const subtotal = cartData.subtotal || 0;
  const shipping = 5.0;
  const total = subtotal + shipping;

  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("total").textContent = `$${total.toFixed(2)}`;
}

// Fallback to localStorage cart
function displayCartFromLocalStorage() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!cart.length || !user) {
    document.getElementById("cartItems").innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some products to your cart and they will appear here</p>
                <a href="products.html" class="btn-shopping">
                    <i class="fas fa-store"></i> Start Shopping
                </a>
            </div>
        `;
    return;
  }

  // Calculate totals
  let subtotal = 0;
  let itemsHTML = "";

  // Note: This is a simplified version. In a real app, you'd need to fetch product details
  cart.forEach((item) => {
    // For demo, use placeholder values
    const price = 19.99;
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    itemsHTML += `
            <div class="cart-item">
                <div class="item-image">
                    <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" alt="Product">
                </div>
                <div class="item-details">
                    <h3 class="item-name">Product ${item.product_id}</h3>
                    <span class="item-category">Product</span>
                    <div class="item-price">$${price.toFixed(2)}</div>
                    <div class="item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="text" class="quantity-input" value="${
                              item.quantity
                            }">
                            <button class="quantity-btn">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-item">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
                <div class="item-total">
                    $${itemTotal.toFixed(2)}
                </div>
            </div>
        `;
  });

  document.getElementById("cartItems").innerHTML = itemsHTML;

  // Update summary
  const shipping = 5.0;
  const total = subtotal + shipping;

  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("total").textContent = `$${total.toFixed(2)}`;
}

async function updateQuantity(itemId, newQuantity, maxStock) {
  // Validate new quantity
  if (newQuantity < 0) newQuantity = 0;

  // Check stock availability - client-side validation first
  if (maxStock && newQuantity > maxStock) {
    hideLoading(); // Hide loading immediately
    showToast(`Maximum ${maxStock} items available`, "error");

    // Just reload cart to reflect actual state
    loadCart();
    return;
  }

  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/cart/update/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ quantity: newQuantity }),
    });

    const responseData = await response.json();

    if (response.ok) {
      // Reload cart
      await loadCart();

      if (newQuantity === 0) {
        showToast("Item removed from cart", "success");
      } else {
        showToast(`Quantity updated to ${newQuantity}`, "success");
      }
    } else {
      // Server-side validation failed
      hideLoading(); // Hide loading on error

      // Extract error message
      let errorMsg = responseData.error || "Failed to update cart";

      // Check if it's a stock error
      if (
        errorMsg.includes("stock") ||
        errorMsg.includes("Stock") ||
        errorMsg.includes("Maximum")
      ) {
        // Extract the max number from error message if available
        const maxMatch = errorMsg.match(/\d+/);
        if (maxMatch) {
          errorMsg = `Maximum ${maxMatch[0]} items available`;
        }
        showToast(errorMsg, "error");
      } else {
        showToast(errorMsg, "error");
      }

      // Reload cart to get accurate stock info
      loadCart();
    }
  } catch (error) {
    console.error("Error updating quantity:", error);
    hideLoading(); // Hide loading on network error
    showToast("Network error", "error");
  }
}

function updateQuantityFromInput(itemId, value, maxStock) {
  const quantity = parseInt(value);
  if (isNaN(quantity) || quantity < 0) {
    showToast("Please enter a valid quantity", "error");
    loadCart(); // Reload to reset input
    return;
  }

  // Validate against stock
  if (maxStock && quantity > maxStock) {
    showToast(`Maximum ${maxStock} items available`, "error");
    loadCart(); // Reload to reset input
    return;
  }

  updateQuantity(itemId, quantity, maxStock);
}

async function removeFromCart(itemId) {
  if (!confirm("Remove this item from cart?")) return;

  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/cart/remove/${itemId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      // Reload cart
      await loadCart();
      showToast("Item removed from cart", "success");
    } else {
      const error = await response.json();
      hideLoading();
      showToast(error.error || "Failed to remove item", "error");
    }
  } catch (error) {
    console.error("Error removing item:", error);
    hideLoading();
    showToast("Network error", "error");
  }
}

async function clearCart() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  if (!confirm("Clear all items from cart?")) return;

  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/cart/clear/${user.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      // Reload cart
      await loadCart();
      showToast("Cart cleared", "success");
    } else {
      hideLoading();
      const error = await response.json();
      showToast(error.error || "Failed to clear cart", "error");
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
    hideLoading();
    showToast("Failed to clear cart", "error");
  }
}

function proceedToCheckout() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Check if cart is empty
  const cartCount = document.querySelector(".cart-count").textContent;
  if (cartCount === "0" || cartCount === "") {
    showToast("Your cart is empty", "error");
    return;
  }

  // Redirect to checkout page
  window.location.href = "checkout.html";
}

function updateCartCount(count) {
  const cartCountElement = document.querySelector(".cart-count");
  if (cartCountElement) {
    if (count !== undefined) {
      cartCountElement.textContent = count;
    } else {
      // Get count from API or localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        fetch(`${API_BASE_URL}/cart?user_id=${user.id}`)
          .then((r) => r.json())
          .then((data) => {
            cartCountElement.textContent = data.item_count || 0;
          })
          .catch(() => {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const totalItems = cart.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            cartCountElement.textContent = totalItems;
          });
      }
    }

    cartCountElement.style.display =
      parseInt(cartCountElement.textContent) > 0 ? "inline-block" : "none";
  }
}

// Utility functions (make sure these exist)
function showLoading() {
  const loadingModal = document.getElementById("loadingModal");
  if (loadingModal) {
    loadingModal.style.display = "flex";
  }
}

function hideLoading() {
  const loadingModal = document.getElementById("loadingModal");
  if (loadingModal) {
    loadingModal.style.display = "none";
  }
}

function showToast(message, type = "info") {
  const toast = document.getElementById("messageToast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = "toast show";

  // Set color based on type
  if (type === "error") {
    toast.style.backgroundColor = "#f56565";
  } else if (type === "success") {
    toast.style.backgroundColor = "#48bb78";
  } else {
    toast.style.backgroundColor = "#4299e1";
  }

  // Hide after 3 seconds
  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

// Remove inline onclick handlers from window object
// window.updateQuantity = updateQuantity;
// window.updateQuantityFromInput = updateQuantityFromInput;
// window.removeFromCart = removeFromCart;
// window.clearCart = clearCart;
window.proceedToCheckout = proceedToCheckout;
