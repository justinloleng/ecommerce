document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  checkAuthStatus();

  // Load cart items
  loadCart();

  // Setup navigation
  setupNavigation();

  // Setup checkout button
  document
    .getElementById("checkoutBtn")
    .addEventListener("click", checkoutAllItems);
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

  // Update cart count
  updateCartCount();
}

async function loadCart() {
  try {
    showLoading();

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const response = await fetch(`${API_BASE_URL}/cart?user_id=${user.id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load cart");
    }

    const cartData = await response.json();

    // Display cart items with checkboxes
    displayCartItems(cartData);

    // Update cart count
    updateCartCount();
  } catch (error) {
    console.error("Error loading cart:", error);
    showToast("Failed to load cart items", "error");
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
        <p>Looks like you haven't added any items to your cart yet.</p>
        <a href="products.html" class="btn-shopping">
          <i class="fas fa-shopping-bag"></i>
          Start Shopping
        </a>
      </div>
    `;

    // Hide checkout selected items button
    document.getElementById("checkoutSelectedBtn").style.display = "none";
    document.getElementById("checkoutBtn").disabled = true;
    document.getElementById("checkoutBtn").innerHTML =
      '<i class="fas fa-times-circle"></i> Cart is Empty';

    // Update totals to $0
    document.getElementById("subtotal").textContent = "$0.00";
    document.getElementById("total").textContent = "$5.00";

    return;
  }

  let itemsHTML = "";
  let subtotal = 0;

  // Create select all header
  itemsHTML += `
    <div class="select-all-container">
      <label for="selectAllCheckbox">
        <input type="checkbox" id="selectAllCheckbox">
        <span>Select All Items for Checkout</span>
        <span class="item-count">(${cartData.items.length} items)</span>
      </label>
    </div>
  `;

  cartData.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    itemsHTML += `
      <div class="cart-item" data-item-id="${item.id}" data-product-id="${
      item.product_id
    }">
        <div class="cart-item-checkbox-container">
          <input type="checkbox" 
                 class="cart-item-checkbox" 
                 data-item-id="${item.id}"
                 data-product-id="${item.product_id}"
                 data-quantity="${item.quantity}"
                 data-price="${item.price}">
        </div>
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
          <div class="item-category">${item.category || "General"}</div>
          <div class="item-price">$${item.price.toFixed(2)} each</div>
          <div class="item-actions">
            <div class="quantity-controls">
              <button class="quantity-btn" onclick="updateQuantity(${
                item.id
              }, ${item.quantity - 1})">
                <i class="fas fa-minus"></i>
              </button>
              <input type="text" 
                     class="quantity-input" 
                     value="${item.quantity}" 
                     readonly
                     id="quantity-${item.id}">
              <button class="quantity-btn" onclick="updateQuantity(${
                item.id
              }, ${item.quantity + 1})">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
        <div class="item-total" id="item-total-${item.id}">
          $${itemTotal.toFixed(2)}
        </div>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = itemsHTML;

  // Setup checkbox events
  setupCheckboxEvents();

  // Update totals
  updateTotals(subtotal);

  // Show checkout selected items button
  document.getElementById("checkoutSelectedBtn").style.display = "flex";
  document.getElementById("checkoutSelectedBtn").disabled = false;

  // Enable checkout button
  document.getElementById("checkoutBtn").disabled = false;
  document.getElementById("checkoutBtn").innerHTML =
    '<i class="fas fa-lock"></i> Checkout All Items';
}

function setupCheckboxEvents() {
  // Select All checkbox
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const itemCheckboxes = document.querySelectorAll(".cart-item-checkbox");
  const checkoutSelectedBtn = document.getElementById("checkoutSelectedBtn");
  const selectedCount = document.getElementById("selectedCount");

  // Set initial state of select all checkbox
  const checkedItems = Array.from(itemCheckboxes).filter((cb) => cb.checked);
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = checkedItems.length === itemCheckboxes.length;
    selectAllCheckbox.indeterminate =
      checkedItems.length > 0 && checkedItems.length < itemCheckboxes.length;
  }

  // Update selected count
  updateSelectedCount();

  // Select All functionality
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", function () {
      const isChecked = this.checked;
      itemCheckboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
        updateCartItemSelection(checkbox);
      });
      updateSelectedCount();
    });
  }

  // Individual checkbox functionality
  itemCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      updateCartItemSelection(this);
      updateSelectAllCheckbox();
      updateSelectedCount();
    });
  });

  function updateSelectedCount() {
    const checkedItems = Array.from(itemCheckboxes).filter((cb) => cb.checked);
    const count = checkedItems.length;

    if (selectedCount) {
      selectedCount.textContent = count;
    }

    if (checkoutSelectedBtn) {
      checkoutSelectedBtn.disabled = count === 0;
    }
  }

  function updateCartItemSelection(checkbox) {
    const cartItem = checkbox.closest(".cart-item");
    if (checkbox.checked) {
      cartItem.classList.add("selected");
    } else {
      cartItem.classList.remove("selected");
    }
  }
}

function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const itemCheckboxes = document.querySelectorAll(".cart-item-checkbox");

  if (!selectAllCheckbox || itemCheckboxes.length === 0) return;

  const checkedItems = Array.from(itemCheckboxes).filter((cb) => cb.checked);

  if (checkedItems.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedItems.length === itemCheckboxes.length) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

function updateTotals(subtotal) {
  const shipping = 5.0;
  const total = subtotal + shipping;

  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("total").textContent = `$${total.toFixed(2)}`;
}

async function updateQuantity(itemId, newQuantity) {
  if (newQuantity < 1) {
    // If quantity becomes 0, remove item
    removeFromCart(itemId);
    return;
  }

  try {
    showLoading();

    const user = JSON.parse(localStorage.getItem("user"));

    const response = await fetch(`${API_BASE_URL}/cart/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        user_id: user.id,
        quantity: newQuantity,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update quantity");
    }

    // Update quantity display
    document.getElementById(`quantity-${itemId}`).value = newQuantity;

    // Recalculate item total
    const item = await response.json();
    const itemTotal = item.price * item.quantity;
    document.getElementById(
      `item-total-${itemId}`
    ).textContent = `$${itemTotal.toFixed(2)}`;

    // Reload cart to update totals
    await loadCart();

    showToast("Quantity updated successfully", "success");
  } catch (error) {
    console.error("Error updating quantity:", error);
    showToast("Failed to update quantity", "error");
  } finally {
    hideLoading();
  }
}

async function removeFromCart(itemId) {
  if (!confirm("Are you sure you want to remove this item from your cart?")) {
    return;
  }

  try {
    showLoading();

    const user = JSON.parse(localStorage.getItem("user"));

    const response = await fetch(
      `${API_BASE_URL}/cart/${itemId}?user_id=${user.id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to remove item");
    }

    // Remove item from DOM
    const cartItem = document.querySelector(`[data-item-id="${itemId}"]`);
    if (cartItem) {
      cartItem.style.opacity = "0.5";
      setTimeout(() => {
        cartItem.remove();
        // Reload cart to update totals
        loadCart();
      }, 300);
    }

    showToast("Item removed from cart", "success");
  } catch (error) {
    console.error("Error removing item:", error);
    showToast("Failed to remove item", "error");
  } finally {
    hideLoading();
  }
}

// Function to handle checkout of selected items
function checkoutSelectedItems() {
  const checkboxes = document.querySelectorAll(".cart-item-checkbox:checked");
  const selectedItems = [];

  checkboxes.forEach((checkbox) => {
    const itemId = checkbox.dataset.itemId;
    const productId = checkbox.dataset.productId;
    const quantity = parseInt(checkbox.dataset.quantity);
    const price = parseFloat(checkbox.dataset.price);

    selectedItems.push({
      cart_item_id: itemId,
      product_id: productId,
      quantity: quantity,
      price: price,
    });
  });

  if (selectedItems.length === 0) {
    showToast("Please select items to checkout", "error");
    return;
  }

  // Save selected items to localStorage
  localStorage.setItem("selectedCartItems", JSON.stringify(selectedItems));

  // Redirect to checkout page
  window.location.href = "checkout.html";
}

// Function handling checkout of all items
function checkoutAllItems() {
  // Clear any previously selected items
  localStorage.removeItem("selectedCartItems");

  // Redirect to checkout page (all items will be selected by default)
  window.location.href = "checkout.html";
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
          cartCountElement.style.display =
            parseInt(cartCountElement.textContent) > 0
              ? "inline-block"
              : "none";
        })
        .catch(() => {
          // Fallback to localStorage
          const cart = JSON.parse(localStorage.getItem("cart") || "[]");
          const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
          cartCountElement.textContent = totalItems;
          cartCountElement.style.display =
            totalItems > 0 ? "inline-block" : "none";
        });
    }
  }
}


window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.checkoutSelectedItems = checkoutSelectedItems;
window.checkoutAllItems = checkoutAllItems;
