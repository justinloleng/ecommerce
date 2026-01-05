document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  checkAuthStatus();

  // Load checkout data
  loadCheckoutData();

  // Setup navigation
  setupNavigation();

  // Setup form events
  setupFormEvents();

  // Setup place order button
  document
    .getElementById("placeOrderBtn")
    .addEventListener("click", placeOrder);
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

function setupFormEvents() {
  // Payment method change
  const paymentMethods = document.querySelectorAll(
    'input[name="paymentMethod"]'
  );
  paymentMethods.forEach((method) => {
    method.addEventListener("change", function () {
      const proofSection = document.getElementById("paymentProofSection");
      if (this.value === "online_payment") {
        proofSection.classList.add("active");
      } else {
        proofSection.classList.remove("active");
      }
    });
  });

  // File upload
  const fileInput = document.getElementById("paymentProof");
  fileInput.addEventListener("change", function () {
    const fileName = document.getElementById("fileName");
    if (this.files.length > 0) {
      fileName.textContent = this.files[0].name;
    } else {
      fileName.textContent = "No file chosen";
    }
  });
}

async function loadCheckoutData() {
  try {
    showLoading();

    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // Pre-fill form with user data
    prefillForm(user);

    // Check if we have selected items in localStorage
    const selectedCartItems =
      JSON.parse(localStorage.getItem("selectedCartItems")) || [];

    // Fetch cart for order summary
    const response = await fetch(`${API_BASE_URL}/cart?user_id=${user.id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load cart");
    }

    const cartData = await response.json();

    // Display order summary with checkboxes
    displayOrderSummary(cartData, selectedCartItems);
  } catch (error) {
    console.error("Error loading checkout data:", error);
    showToast("Failed to load checkout data", "error");
  } finally {
    hideLoading();
  }
}

function prefillForm(user) {
  document.getElementById(
    "fullName"
  ).value = `${user.first_name} ${user.last_name}`;
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("address").value = user.address || "";
}

function displayOrderSummary(cartData, selectedCartItems) {
  const orderItemsContainer = document.getElementById("orderItems");

  if (!cartData.items || cartData.items.length === 0) {
    orderItemsContainer.innerHTML = `
            <div style="text-align: center; color: #718096; padding: 20px;">
                <i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Your cart is empty</p>
            </div>
        `;

    document.getElementById("summarySubtotal").textContent = "$0.00";
    document.getElementById("summaryTotal").textContent = "$5.00";
    document.getElementById("placeOrderBtn").disabled = true;
    document.getElementById("placeOrderBtn").innerHTML =
      '<i class="fas fa-times-circle"></i> Cart is Empty';

    return;
  }

  let itemsHTML = "";
  let subtotal = 0;
  let hasSelectedItems = false;

  // Create select all checkbox header
  itemsHTML += `
    <div class="select-all-container" style="margin-bottom: 15px; padding: 10px; background: #f7fafc; border-radius: 8px;">
      <label style="display: flex; align-items: center; cursor: pointer;">
        <input type="checkbox" id="selectAllCheckbox" style="margin-right: 10px; transform: scale(1.2);">
        <span style="font-weight: 600;">Select All Items</span>
      </label>
    </div>
  `;

  cartData.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    const isSelected =
      selectedCartItems.length === 0 ||
      selectedCartItems.some(
        (selected) => selected.product_id === item.product_id
      );

    if (isSelected) {
      subtotal += itemTotal;
      hasSelectedItems = true;
    }

    itemsHTML += `
            <div class="summary-item" style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="margin-right: 15px;">
                  <input type="checkbox" 
                         class="item-checkbox" 
                         data-product-id="${item.product_id}"
                         data-quantity="${item.quantity}"
                         data-price="${item.price}"
                         ${isSelected ? "checked" : ""}
                         style="transform: scale(1.2);">
                </div>
                <div style="display: flex; align-items: center; flex-grow: 1;">
                    <div class="item-info" style="display: flex; align-items: center; flex-grow: 1;">
                        <div class="item-image" style="margin-right: 15px;">
                            <img src="${
                              item.image_url ||
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
                            }" 
                                 alt="${item.name}"
                                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                                 onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
                        </div>
                        <div style="flex-grow: 1;">
                            <div class="item-name" style="font-weight: 600; margin-bottom: 5px;">${
                              item.name
                            }</div>
                            <div class="item-quantity" style="color: #718096; font-size: 14px;">Quantity: ${
                              item.quantity
                            }</div>
                            <div class="item-unit-price" style="color: #718096; font-size: 14px;">Unit Price: $${item.price.toFixed(
                              2
                            )}</div>
                        </div>
                    </div>
                    <div class="item-price" style="font-weight: 600; font-size: 18px;">
                        $${itemTotal.toFixed(2)}
                    </div>
                </div>
            </div>
        `;
  });

  orderItemsContainer.innerHTML = itemsHTML;

  // Add event listeners for checkboxes
  setupCheckboxEvents();

  // Update totals
  const shipping = 5.0;
  const total = subtotal + shipping;

  document.getElementById("summarySubtotal").textContent = `$${subtotal.toFixed(
    2
  )}`;
  document.getElementById("summaryTotal").textContent = `$${total.toFixed(2)}`;

  // Enable/disable place order button based on selection
  document.getElementById("placeOrderBtn").disabled = !hasSelectedItems;
  document.getElementById("placeOrderBtn").innerHTML = hasSelectedItems
    ? '<i class="fas fa-check-circle"></i> Place Order'
    : '<i class="fas fa-times-circle"></i> No Items Selected';
}

function setupCheckboxEvents() {
  // Select All checkbox
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const itemCheckboxes = document.querySelectorAll(".item-checkbox");

  // Set initial state of select all checkbox
  const checkedItems = Array.from(itemCheckboxes).filter((cb) => cb.checked);
  selectAllCheckbox.checked = checkedItems.length === itemCheckboxes.length;
  selectAllCheckbox.indeterminate =
    checkedItems.length > 0 && checkedItems.length < itemCheckboxes.length;

  // Select All functionality
  selectAllCheckbox.addEventListener("change", function () {
    const isChecked = this.checked;
    itemCheckboxes.forEach((checkbox) => {
      checkbox.checked = isChecked;
    });
    updateOrderSummary();
  });

  // Individual checkbox functionality
  itemCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      updateSelectAllCheckbox();
      updateOrderSummary();
    });
  });
}

function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const itemCheckboxes = document.querySelectorAll(".item-checkbox");

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

function updateOrderSummary() {
  const itemCheckboxes = document.querySelectorAll(".item-checkbox");
  let subtotal = 0;

  itemCheckboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      const price = parseFloat(checkbox.dataset.price);
      const quantity = parseInt(checkbox.dataset.quantity);
      subtotal += price * quantity;
    }
  });

  // Update totals
  const shipping = 5.0;
  const total = subtotal + shipping;

  document.getElementById("summarySubtotal").textContent = `$${subtotal.toFixed(
    2
  )}`;
  document.getElementById("summaryTotal").textContent = `$${total.toFixed(2)}`;

  // Enable/disable place order button based on selection
  const hasSelectedItems = Array.from(itemCheckboxes).some((cb) => cb.checked);
  document.getElementById("placeOrderBtn").disabled = !hasSelectedItems;
  document.getElementById("placeOrderBtn").innerHTML = hasSelectedItems
    ? '<i class="fas fa-check-circle"></i> Place Order'
    : '<i class="fas fa-times-circle"></i> No Items Selected';
}

async function placeOrder() {
  try {
    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check if any items are selected
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      showToast("Please select at least one item to checkout", "error");
      return;
    }

    showLoading();

    // Get form data
    const formData = {
      user_id: getUserId(),
      shipping_address: getShippingAddress(),
      payment_method: getPaymentMethod(),
      selected_items: selectedItems, // Include selected items in the order
    };

    // For online payment, check if file is uploaded
    if (formData.payment_method === "online_payment") {
      const fileInput = document.getElementById("paymentProof");
      if (!fileInput.files.length) {
        showToast("Please upload payment proof for online payment", "error");
        hideLoading();
        return;
      }
    }

    // Create order
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const result = await response.json();

      // Log order creation for debugging
      console.log("Order created successfully:", result);

      // If online payment, upload payment proof
      if (formData.payment_method === "online_payment") {
        const fileInput = document.getElementById("paymentProof");
        if (fileInput.files.length > 0) {
          try {
            const paymentFormData = new FormData();
            paymentFormData.append("payment_proof", fileInput.files[0]);

            if (!result.order || !result.order.id) {
              console.error("Order ID not found in response:", result);
              showToast(
                "Order created but payment proof upload failed. Please contact support.",
                "warning"
              );
            } else {
              console.log(
                `Uploading payment proof for order ID: ${result.order.id}`
              );

              const uploadResponse = await fetch(
                `${API_BASE_URL}/orders/${result.order.id}/payment-proof`,
                {
                  method: "POST",
                  credentials: "include",
                  body: paymentFormData,
                }
              );

              if (!uploadResponse.ok) {
                const uploadError = await uploadResponse.json();
                console.error("Payment proof upload failed:", uploadError);
                showToast(
                  "Order created but payment proof upload failed. Please contact support.",
                  "warning"
                );
              } else {
                const uploadResult = await uploadResponse.json();
                console.log(
                  "Payment proof uploaded successfully:",
                  uploadResult
                );
                showToast(
                  "Order placed and payment proof uploaded successfully!",
                  "success"
                );
              }
            }
          } catch (uploadError) {
            console.error("Payment proof upload error:", uploadError);
            showToast(
              "Order created but payment proof upload failed. Please contact support.",
              "warning"
            );
          }
        }
      } else {
        showToast("Order placed successfully!", "success");
      }

      // Clear selected items from localStorage after successful order
      localStorage.removeItem("selectedCartItems");

      // Redirect to order confirmation page
      setTimeout(() => {
        window.location.href = `order-confirmation.html?order_id=${result.order.id}`;
      }, 1500);
    } else {
      const error = await response.json();
      showToast(error.error || "Failed to place order", "error");
    }
  } catch (error) {
    console.error("Error placing order:", error);
    showToast("Network error", "error");
  } finally {
    hideLoading();
  }
}

function getSelectedItems() {
  const selectedItems = [];
  const itemCheckboxes = document.querySelectorAll(".item-checkbox:checked");

  itemCheckboxes.forEach((checkbox) => {
    selectedItems.push({
      product_id: parseInt(checkbox.dataset.productId),
      quantity: parseInt(checkbox.dataset.quantity),
      price: parseFloat(checkbox.dataset.price),
    });
  });

  return selectedItems;
}

function validateForm() {
  const requiredFields = [
    "fullName",
    "email",
    "phone",
    "address",
    "city",
    "zipCode",
    "country",
  ];

  for (const fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field.value.trim()) {
      showToast(`Please fill in ${field.placeholder || fieldId}`, "error");
      field.focus();
      return false;
    }
  }

  // Validate email
  const email = document.getElementById("email").value;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address", "error");
    return false;
  }

  return true;
}

function getUserId() {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? user.id : null;
}

function getShippingAddress() {
  const address = document.getElementById("address").value;
  const city = document.getElementById("city").value;
  const zipCode = document.getElementById("zipCode").value;
  const country = document.getElementById("country").value;

  return `${address}, ${city}, ${zipCode}, ${country}`;
}

function getPaymentMethod() {
  const selectedMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );
  return selectedMethod ? selectedMethod.value : "cash_on_delivery";
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
          // Fallback to localStorage
          const cart = JSON.parse(localStorage.getItem("cart") || "[]");
          const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
          cartCountElement.textContent = totalItems;
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

window.placeOrder = placeOrder;
