// DOM Ready
document.addEventListener("DOMContentLoaded", function () {
  // Check auth status on page load
  checkAuthStatus();

  // Form switching functionality
  const showLoginBtn = document.getElementById("showLogin");
  const showRegisterBtn = document.getElementById("showRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const switchFormLinks = document.querySelectorAll(".switch-form");

  // Navigation buttons
  if (showLoginBtn && showRegisterBtn) {
    showLoginBtn.addEventListener("click", function (e) {
      e.preventDefault();
      loginForm.classList.add("active");
      registerForm.classList.remove("active");
      showLoginBtn.classList.add("active");
      showRegisterBtn.classList.remove("active");
    });

    showRegisterBtn.addEventListener("click", function (e) {
      e.preventDefault();
      registerForm.classList.add("active");
      loginForm.classList.remove("active");
      showRegisterBtn.classList.add("active");
      showLoginBtn.classList.remove("active");
    });
  }

  // Switch form links
  switchFormLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetForm = this.getAttribute("data-form");

      if (targetForm === "login") {
        loginForm.classList.add("active");
        registerForm.classList.remove("active");
        if (showLoginBtn) showLoginBtn.classList.add("active");
        if (showRegisterBtn) showRegisterBtn.classList.remove("active");
      } else {
        registerForm.classList.add("active");
        loginForm.classList.remove("active");
        if (showRegisterBtn) showRegisterBtn.classList.add("active");
        if (showLoginBtn) showLoginBtn.classList.remove("active");
      }
    });
  });

  // Toggle password visibility
  const toggleButtons = document.querySelectorAll(".toggle-password");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const input = document.getElementById(targetId);
      const icon = this.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.className = "fas fa-eye-slash";
      } else {
        input.type = "password";
        icon.className = "fas fa-eye";
      }
    });
  });

  // Real-time validation for registration form
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  if (usernameInput) {
    let usernameTimeout;
    usernameInput.addEventListener("input", function () {
      clearTimeout(usernameTimeout);
      usernameTimeout = setTimeout(() => {
        checkUsernameAvailability(this.value);
      }, 500);
    });
  }

  if (emailInput) {
    let emailTimeout;
    emailInput.addEventListener("input", function () {
      clearTimeout(emailTimeout);
      emailTimeout = setTimeout(() => {
        if (validateEmail(this.value)) {
          checkEmailAvailability(this.value);
        } else {
          const feedback = document.getElementById("emailFeedback");
          feedback.textContent = "Please enter a valid email";
          feedback.className = "input-feedback error";
        }
      }, 500);
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      updatePasswordStrength(this.value);
      if (confirmPasswordInput && confirmPasswordInput.value) {
        validatePasswordMatch();
      }
    });
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", validatePasswordMatch);
  }

  // Form submissions
  const loginFormElement = document.getElementById("loginFormElement");
  const registerFormElement = document.getElementById("registerFormElement");

  if (loginFormElement) {
    loginFormElement.addEventListener("submit", handleLogin);
  }

  if (registerFormElement) {
    registerFormElement.addEventListener("submit", handleRegister);
  }

  // Forgot password link
  const forgotPasswordLink = document.querySelector(".forgot-password");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (e) {
      e.preventDefault();
      showToast("Password reset feature coming soon!", "info");
    });
  }
});
