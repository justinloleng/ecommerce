// Checkout functionality
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
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.is_admin === 1) {
    const adminLink = document.getElementById('adminDashboardLink');
    if (adminLink) {
      adminLink.style.display = 'block';
      adminLink.href = '../admin/admin-panel.html';
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

    // Fetch cart for order summary
    const response = await fetch(`${API_BASE_URL}/cart?user_id=${user.id}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load cart");
    }

    const cartData = await response.json();

    // Display order summary
    displayOrderSummary(cartData);
  } catch (error) {
    console.error("Error loading checkout data:", error);
    showToast("Failed to load checkout data", "error");
  } finally {
    hideLoading();
  }
}

function prefillForm(user) {
  // Pre-fill form with user data if available
  document.getElementById(
    "fullName"
  ).value = `${user.first_name} ${user.last_name}`;
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("address").value = user.address || "";
}

function displayOrderSummary(cartData) {
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

  cartData.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    itemsHTML += `
            <div class="summary-item">
                <div class="item-info">
                    <div class="item-image">
                        <img src="${
                          item.image_url ||
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
                        }" 
                             alt="${item.name}"
                             onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
                    </div>
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-quantity">Quantity: ${
                          item.quantity
                        }</div>
                    </div>
                </div>
                <div class="item-price">
                    $${itemTotal.toFixed(2)}
                </div>
            </div>
        `;
  });

  orderItemsContainer.innerHTML = itemsHTML;

  // Update totals
  const shipping = 5.0;
  const total = subtotal + shipping;

  document.getElementById("summarySubtotal").textContent = `$${subtotal.toFixed(
    2
  )}`;
  document.getElementById("summaryTotal").textContent = `$${total.toFixed(2)}`;

  // Enable place order button
  document.getElementById("placeOrderBtn").disabled = false;
  document.getElementById("placeOrderBtn").innerHTML =
    '<i class="fas fa-check-circle"></i> Place Order';
}

async function placeOrder() {
  try {
    // Validate form
    if (!validateForm()) {
      return;
    }

    showLoading();

    // Get form data
    const formData = {
      user_id: getUserId(),
      shipping_address: getShippingAddress(),
      payment_method: getPaymentMethod(),
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
            paymentFormData.append('payment_proof', fileInput.files[0]);
            
            // Ensure order ID exists before uploading
            if (!result.order || !result.order.id) {
              console.error("Order ID not found in response:", result);
              showToast("Order created but payment proof upload failed. Please contact support.", "warning");
            } else {
              console.log(`Uploading payment proof for order ID: ${result.order.id}`);
              
              const uploadResponse = await fetch(`${API_BASE_URL}/orders/${result.order.id}/payment-proof`, {
                method: "POST",
                credentials: "include",
                body: paymentFormData,
              });
              
              if (!uploadResponse.ok) {
                const uploadError = await uploadResponse.json();
                console.error("Payment proof upload failed:", uploadError);
                showToast("Order created but payment proof upload failed. Please contact support.", "warning");
              } else {
                const uploadResult = await uploadResponse.json();
                console.log("Payment proof uploaded successfully:", uploadResult);
                showToast("Order placed and payment proof uploaded successfully!", "success");
              }
            }
          } catch (uploadError) {
            console.error("Payment proof upload error:", uploadError);
            showToast("Order created but payment proof upload failed. Please contact support.", "warning");
          }
        }
      } else {
        showToast("Order placed successfully!", "success");
      }

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
