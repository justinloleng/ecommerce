// User Management JavaScript
let currentUsers = [];

async function loadUsers() {
  try {
    // Show loading state
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = `
      <tr><td colspan="9" class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading users...</p>
      </td></tr>
    `;

    const response = await fetch(`${API_BASE_URL}/admin/users`);

    if (!response.ok) {
      throw new Error("Failed to load users");
    }

    currentUsers = await response.json();
    displayUsers(currentUsers);
  } catch (error) {
    console.error("Error loading users:", error);
    document.getElementById("usersTableBody").innerHTML = `
      <tr><td colspan="9" class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load users</p>
      </td></tr>
    `;
  }
}

function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");

  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="9" class="empty-state">
        <i class="fas fa-users"></i>
        <p>No users found</p>
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td>${user.id}</td>
      <td>${user.first_name} ${user.last_name}</td>
      <td>${user.email}</td>
      <td>${user.phone || "N/A"}</td>
      <td>${user.total_orders || 0}</td>
      <td><strong>$${(user.total_spent || 0).toFixed(2)}</strong></td>
      <td>
        <span class="badge ${
          user.is_active ? "badge-delivered" : "badge-cancelled"
        }">
          ${user.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <span class="badge ${
          user.is_admin ? "badge-processing" : "badge-pending"
        }">
          ${user.is_admin ? "Yes" : "No"}
        </span>
      </td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="showPasswordResetModal(${
          user.id
        }, '${user.first_name} ${user.last_name}', '${
        user.email
      }')" title="Reset Password">
          <i class="fas fa-key"></i>
        </button>
        ${
          user.is_active
            ? `
          <button class="btn btn-danger btn-sm" onclick="deactivateUser(${user.id})" title="Deactivate Account">
            <i class="fas fa-ban"></i>
          </button>
        `
            : `
          <button class="btn btn-success btn-sm" onclick="activateUser(${user.id})" title="Activate Account">
            <i class="fas fa-check"></i>
          </button>
        `
        }
      </td>
    </tr>
  `
    )
    .join("");
}

function showPasswordResetModal(userId, username, email) {
  document.getElementById("resetUserId").value = userId;
  document.getElementById(
    "resetUserInfo"
  ).textContent = `${username} (${email})`;
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  document.getElementById("passwordResetModal").classList.add("active");
}

document
  .getElementById("passwordResetForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const userId = document.getElementById("resetUserId").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword =
      document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/reset-password`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_password: newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      showToast("Password reset successfully", "success");
      closeModal("passwordResetModal");
    } catch (error) {
      console.error("Error resetting password:", error);
      showToast(error.message || "Failed to reset password", "error");
    }
  });

async function deactivateUser(userId) {
  // Find the user in currentUsers array
  const user = currentUsers.find((u) => u.id === userId);

  if (user && !user.is_active) {
    showToast("This account is already deactivated", "info");
    return;
  }

  if (
    !confirm("Are you sure you want to deactivate this user account?")
  ) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/deactivate`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to deactivate user");
    }

    showToast(data.message || "User deactivated successfully", "success");
    loadUsers();
  } catch (error) {
    console.error("Error deactivating user:", error);
    showToast(error.message || "Failed to deactivate user", "error");
  }
}

async function activateUser(userId) {
  // Find the user in currentUsers array
  const user = currentUsers.find((u) => u.id === userId);

  if (user && user.is_active) {
    showToast("This account is already active", "info");
    return;
  }

  if (!confirm("Are you sure you want to activate this user account?")) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/activate`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to activate user");
    }

    showToast(data.message || "User activated successfully", "success");
    loadUsers();
  } catch (error) {
    console.error("Error activating user:", error);
    showToast(error.message || "Failed to activate user", "error");
  }
}
