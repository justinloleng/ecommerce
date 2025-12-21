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

  cartData.items.forEach((item) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);

    itemsHTML += `
            <div class="cart-item" data-item-id="${item.id}">
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
                    <div class="item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${
                              item.id
                            }, ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="text" class="quantity-input" value="${
                              item.quantity
                            }" 
                                   data-item-id="${item.id}"
                                   onchange="updateQuantityFromInput(${
                                     item.id
                                   }, this.value)">
                            <button class="quantity-btn" onclick="updateQuantity(${
                              item.id
                            }, ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart(${
                          item.id
                        })">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
                <div class="item-total">
                    $${itemTotal}
                </div>
            </div>
        `;
  });

  cartItemsContainer.innerHTML = itemsHTML;

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

async function updateQuantity(itemId, newQuantity) {
  if (newQuantity < 0) newQuantity = 0;

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

    if (response.ok) {
      // Reload cart
      loadCart();
      showToast("Cart updated", "success");
    } else {
      const error = await response.json();
      showToast(error.error || "Failed to update cart", "error");
    }
  } catch (error) {
    console.error("Error updating quantity:", error);
    showToast("Network error", "error");
  }
}

function updateQuantityFromInput(itemId, value) {
  const quantity = parseInt(value);
  if (!isNaN(quantity) && quantity >= 0) {
    updateQuantity(itemId, quantity);
  }
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
      loadCart();
      showToast("Item removed from cart", "success");
    } else {
      const error = await response.json();
      showToast(error.error || "Failed to remove item", "error");
    }
  } catch (error) {
    console.error("Error removing item:", error);
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
      loadCart();
      showToast("Cart cleared", "success");
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
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


window.updateQuantity = updateQuantity;
window.updateQuantityFromInput = updateQuantityFromInput;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.proceedToCheckout = proceedToCheckout;
