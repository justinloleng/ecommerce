// Configuration
const API_BASE_URL = "http://localhost:5000/api";

// Show loading modal
function showLoading() {
  const modal = document.getElementById("loadingModal");
  if (modal) modal.classList.add("active");
}

// Hide loading modal
function hideLoading() {
  const modal = document.getElementById("loadingModal");
  if (modal) modal.classList.remove("active");
}

// Show toast message
function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("messageToast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// Validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Check password strength
function checkPasswordStrength(password) {
  let strength = 0;

  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  return strength;
}

// Update password strength indicator
function updatePasswordStrength(password) {
  const strengthBar = document.getElementById("passwordStrength");
  const strengthText = document.getElementById("passwordStrengthText");

  if (!strengthBar || !strengthText) return;

  if (password.length === 0) {
    strengthBar.style.width = "0%";
    strengthBar.className = "strength-fill";
    strengthText.textContent = "";
    return;
  }

  const strength = checkPasswordStrength(password);
  let strengthClass, text;

  if (strength <= 2) {
    strengthClass = "weak";
    text = "Weak";
  } else if (strength <= 4) {
    strengthClass = "medium";
    text = "Medium";
  } else {
    strengthClass = "strong";
    text = "Strong";
  }

  strengthBar.className = `strength-fill ${strengthClass}`;
  strengthText.textContent = text;
}

// Check username availability
async function checkUsernameAvailability(username) {
  if (username.length < 3) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/check-username/${username}`
    );
    if (!response.ok) return;

    const data = await response.json();
    const feedback = document.getElementById("usernameFeedback");
    if (!feedback) return;

    if (data.available) {
      feedback.textContent = "✓ Username available";
      feedback.className = "input-feedback success";
    } else {
      feedback.textContent = "✗ Username already taken";
      feedback.className = "input-feedback error";
    }
  } catch (error) {
    console.error("Error checking username:", error);
  }
}

// Check email availability
async function checkEmailAvailability(email) {
  if (!validateEmail(email)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-email/${email}`);
    if (!response.ok) return;

    const data = await response.json();
    const feedback = document.getElementById("emailFeedback");
    if (!feedback) return;

    if (data.available) {
      feedback.textContent = "✓ Email available";
      feedback.className = "input-feedback success";
    } else {
      feedback.textContent = "✗ Email already registered";
      feedback.className = "input-feedback error";
    }
  } catch (error) {
    console.error("Error checking email:", error);
  }
}

// Validate passwords match
function validatePasswordMatch() {
  const password = document.getElementById("password")?.value || "";
  const confirmPassword =
    document.getElementById("confirmPassword")?.value || "";
  const feedback = document.getElementById("confirmPasswordFeedback");

  if (!feedback) return true;

  if (confirmPassword.length === 0) {
    feedback.textContent = "";
    feedback.className = "input-feedback";
    return true;
  }

  if (password === confirmPassword) {
    feedback.textContent = "✓ Passwords match";
    feedback.className = "input-feedback success";
    return true;
  } else {
    feedback.textContent = "✗ Passwords do not match";
    feedback.className = "input-feedback error";
    return false;
  }
}

// Handle registration form submission
async function handleRegister(event) {
  event.preventDefault();

  // Get form data
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  if (
    !data.first_name?.trim() ||
    !data.last_name?.trim() ||
    !data.username?.trim() ||
    !data.email?.trim() ||
    !data.password?.trim()
  ) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  if (!validateEmail(data.email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  if (data.password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  if (data.password !== data.confirm_password) {
    showToast("Passwords do not match", "error");
    return;
  }

  if (!event.target.terms?.checked) {
    showToast("Please agree to the Terms & Conditions", "error");
    return;
  }
  // Remove confirm_password from data
  delete data.confirm_password;

  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      showToast("Registration successful! Welcome to E-Shop", "success");
      // Auto-login after successful registration
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
    } else {
      showToast(result.error || "Registration failed", "error");
    }
  } catch (error) {
    console.error("Registration error:", error);
    showToast("Network error. Please try again.", "error");
  } finally {
    hideLoading();
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  if (!data.email?.trim() || !data.password?.trim()) {
    showToast("Please enter email and password", "error");
    return;
  }

  if (!validateEmail(data.email)) {
    showToast("Please enter a valid email address", "error");
    return;
  }

  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      showToast("Login successful! Redirecting...", "success");

      localStorage.setItem("user", JSON.stringify(result.user));

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      showToast(result.error || "Login failed", "error");
    }
  } catch (error) {
    console.error("Login error:", error);
    showToast("Network error. Please try again.", "error");
  } finally {
    hideLoading();
  }
}

// Check if user is already logged in
async function checkAuthStatus() {
  // For pages that require authentication
  const currentPage = window.location.pathname;
  const user = JSON.parse(localStorage.getItem("user") || "null");
  
  // Pages that require authentication
  const authRequiredPages = ["dashboard.html", "products.html", "cart.html", "orders.html", "checkout.html"];
  const isAuthRequired = authRequiredPages.some(page => currentPage.includes(page));
  
  // If on login/register page and user exists, redirect to dashboard
  if ((currentPage.includes("index.html") || currentPage.endsWith("/")) && user) {
    window.location.href = "dashboard.html";
    return true;
  }
  
  // If on auth-required page and no user, redirect to login
  if (isAuthRequired && !user) {
    window.location.href = "index.html";
    return false;
  }
  
  return !!user;
}

// Handle logout
async function logout() {
  try {
    showLoading();
    
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      localStorage.clear();
      sessionStorage.clear();

      showToast("Logged out successfully!", "success");

      setTimeout(() => {
        if ("caches" in window) {
          caches.keys().then(function (names) {
            for (let name of names) caches.delete(name);
          });
        }

        window.location.href = "index.html?" + new Date().getTime();
      }, 1000);
    } else {
      const result = await response.json();
      showToast(result.error || "Logout failed", "error");
    }
  } catch (error) {
    console.error("Logout error:", error);

    localStorage.clear();
    window.location.href = "index.html";
  } finally {
    hideLoading();
  }
}
